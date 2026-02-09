import { AgentEvent, EventType } from './types';

type ConnectionStatus = 'disconnected' | 'connecting' | 'connected' | 'error';

interface WebSocketMessage {
  type: 'event' | 'session_start' | 'session_end' | 'ping';
  event?: {
    id: string;
    type: EventType;
    content: string;
    metadata?: Record<string, unknown>;
    parentId?: string;
    timestamp?: string;
  };
  session?: {
    id: string;
    name: string;
    agent: string;
  };
}

interface SynapseWebSocketOptions {
  url: string;
  onEvent: (event: AgentEvent) => void;
  onSessionStart: (session: { id: string; name: string; agent: string }) => void;
  onSessionEnd: () => void;
  onStatusChange: (status: ConnectionStatus) => void;
  onError: (error: string) => void;
}

export class SynapseWebSocket {
  private ws: WebSocket | null = null;
  private options: SynapseWebSocketOptions;
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 3;
  private reconnectTimeout: NodeJS.Timeout | null = null;

  constructor(options: SynapseWebSocketOptions) {
    this.options = options;
  }

  connect() {
    if (this.ws?.readyState === WebSocket.OPEN) {
      return;
    }

    this.options.onStatusChange('connecting');

    try {
      this.ws = new WebSocket(this.options.url);

      this.ws.onopen = () => {
        this.reconnectAttempts = 0;
        this.options.onStatusChange('connected');
      };

      this.ws.onmessage = (event) => {
        try {
          const message: WebSocketMessage = JSON.parse(event.data);
          this.handleMessage(message);
        } catch (e) {
          console.error('Failed to parse WebSocket message:', e);
        }
      };

      this.ws.onerror = () => {
        this.options.onError('Connection error');
        this.options.onStatusChange('error');
      };

      this.ws.onclose = () => {
        this.options.onStatusChange('disconnected');
        this.attemptReconnect();
      };
    } catch (e) {
      this.options.onError(`Failed to connect: ${e instanceof Error ? e.message : 'Unknown error'}`);
      this.options.onStatusChange('error');
    }
  }

  private handleMessage(message: WebSocketMessage) {
    switch (message.type) {
      case 'session_start':
        if (message.session) {
          this.options.onSessionStart(message.session);
        }
        break;

      case 'event':
        if (message.event) {
          const agentEvent: AgentEvent = {
            id: message.event.id,
            type: message.event.type,
            content: message.event.content,
            metadata: message.event.metadata,
            parentId: message.event.parentId,
            timestamp: message.event.timestamp 
              ? new Date(message.event.timestamp) 
              : new Date(),
          };
          this.options.onEvent(agentEvent);
        }
        break;

      case 'session_end':
        this.options.onSessionEnd();
        break;

      case 'ping':
        // Respond with pong to keep connection alive
        this.send({ type: 'pong' });
        break;
    }
  }

  private attemptReconnect() {
    if (this.reconnectAttempts >= this.maxReconnectAttempts) {
      this.options.onError('Max reconnection attempts reached');
      return;
    }

    this.reconnectAttempts++;
    const delay = Math.min(1000 * Math.pow(2, this.reconnectAttempts), 10000);

    this.reconnectTimeout = setTimeout(() => {
      this.connect();
    }, delay);
  }

  send(data: unknown) {
    if (this.ws?.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify(data));
    }
  }

  disconnect() {
    if (this.reconnectTimeout) {
      clearTimeout(this.reconnectTimeout);
      this.reconnectTimeout = null;
    }
    this.reconnectAttempts = this.maxReconnectAttempts; // Prevent auto-reconnect
    
    if (this.ws) {
      this.ws.close();
      this.ws = null;
    }
    
    this.options.onStatusChange('disconnected');
  }

  get isConnected() {
    return this.ws?.readyState === WebSocket.OPEN;
  }
}

// Helper to generate unique IDs
export function generateEventId(): string {
  return `live-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}
