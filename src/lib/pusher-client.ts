import Pusher from 'pusher-js';
import { AgentEvent, AgentSession } from './types';

// Public key only - safe to expose in frontend
const PUSHER_KEY = process.env.NEXT_PUBLIC_PUSHER_KEY || '';
const PUSHER_CLUSTER = process.env.NEXT_PUBLIC_PUSHER_CLUSTER || 'eu';
const CHANNEL_NAME = 'synapse-live';

let pusherInstance: Pusher | null = null;
let channelInstance: ReturnType<Pusher['subscribe']> | null = null;

export interface LiveCallbacks {
  onSessionStart: (session: AgentSession) => void;
  onEvent: (event: AgentEvent) => void;
  onSessionEnd: () => void;
  onError: (error: Error) => void;
}

export function connectToLiveStream(callbacks: LiveCallbacks): () => void {
  if (!PUSHER_KEY) {
    callbacks.onError(new Error('Pusher key not configured'));
    return () => {};
  }

  // Create Pusher instance
  pusherInstance = new Pusher(PUSHER_KEY, {
    cluster: PUSHER_CLUSTER,
  });

  // Subscribe to channel
  channelInstance = pusherInstance.subscribe(CHANNEL_NAME);

  // Handle connection state
  pusherInstance.connection.bind('connected', () => {
    console.log('✅ Connected to live stream');
  });

  pusherInstance.connection.bind('error', (err: Error) => {
    console.error('❌ Pusher connection error:', err);
    callbacks.onError(err);
  });

  // Handle events
  channelInstance.bind('session-start', (data: { session: Partial<AgentSession> }) => {
    const session: AgentSession = {
      id: data.session.id || `live-${Date.now()}`,
      name: data.session.name || '🤖 Data (Live)',
      agent: 'clawdbot',
      startedAt: new Date(data.session.startedAt || Date.now()),
      events: [],
    };
    callbacks.onSessionStart(session);
  });

  channelInstance.bind('event', (data: { event: AgentEvent }) => {
    // Parse timestamp
    const event: AgentEvent = {
      ...data.event,
      timestamp: new Date(data.event.timestamp),
    };
    callbacks.onEvent(event);
  });

  channelInstance.bind('session-end', () => {
    callbacks.onSessionEnd();
  });

  // Return cleanup function
  return () => {
    if (channelInstance) {
      channelInstance.unbind_all();
      pusherInstance?.unsubscribe(CHANNEL_NAME);
    }
    if (pusherInstance) {
      pusherInstance.disconnect();
    }
    pusherInstance = null;
    channelInstance = null;
  };
}

export function isLiveStreamConfigured(): boolean {
  return Boolean(PUSHER_KEY);
}
