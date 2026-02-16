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
    console.error('[Pusher] No API key configured');
    callbacks.onError(new Error('Pusher key not configured'));
    return () => {};
  }

  console.log('[Pusher] Connecting with key:', PUSHER_KEY.slice(0, 8) + '...');

  // Enable Pusher logging in development
  Pusher.logToConsole = true;

  // Create Pusher instance
  pusherInstance = new Pusher(PUSHER_KEY, {
    cluster: PUSHER_CLUSTER,
  });

  // Subscribe to channel
  channelInstance = pusherInstance.subscribe(CHANNEL_NAME);

  // Track if we've created a session
  let sessionCreated = false;

  // Helper to ensure session exists
  const ensureSession = () => {
    if (!sessionCreated) {
      console.log('[Pusher] Creating default session');
      const session: AgentSession = {
        id: `live-${Date.now()}`,
        name: '🤖 Bubbi (Live)',
        agent: 'bubbi',
        startedAt: new Date(),
        events: [],
      };
      callbacks.onSessionStart(session);
      sessionCreated = true;
    }
  };

  // Handle connection state
  pusherInstance.connection.bind('connected', () => {
    console.log('[Pusher] ✅ Connected to Pusher');
    // Create session immediately on connect
    ensureSession();
  });

  pusherInstance.connection.bind('error', (err: Error) => {
    console.error('[Pusher] ❌ Connection error:', err);
    callbacks.onError(err);
  });

  // Handle subscription success
  channelInstance.bind('pusher:subscription_succeeded', () => {
    console.log('[Pusher] ✅ Subscribed to channel:', CHANNEL_NAME);
  });

  // Handle events
  channelInstance.bind('session-start', (data: { session: Partial<AgentSession> }) => {
    console.log('[Pusher] 📦 Received session-start:', data);
    const session: AgentSession = {
      id: data.session.id || `live-${Date.now()}`,
      name: data.session.name || '🤖 Bubbi (Live)',
      agent: 'bubbi',
      startedAt: new Date(data.session.startedAt || Date.now()),
      events: [],
    };
    callbacks.onSessionStart(session);
    sessionCreated = true;
  });

  channelInstance.bind('event', (data: { event: AgentEvent }) => {
    console.log('[Pusher] 📨 Received event:', data.event.type, data.event.content?.slice(0, 50));
    
    // Ensure session exists before adding event
    ensureSession();
    
    // Parse timestamp
    const event: AgentEvent = {
      ...data.event,
      timestamp: new Date(data.event.timestamp),
    };
    callbacks.onEvent(event);
  });

  channelInstance.bind('session-end', () => {
    console.log('[Pusher] 🏁 Session ended');
    callbacks.onSessionEnd();
  });

  // Return cleanup function
  return () => {
    console.log('[Pusher] 🧹 Cleaning up connection');
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
