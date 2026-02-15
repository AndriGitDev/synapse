'use client';

import { useEffect, useRef, useCallback } from 'react';
import Pusher from 'pusher-js';
import { AgentSession, AgentEvent } from './types';

const PUSHER_KEY = process.env.NEXT_PUBLIC_PUSHER_KEY || '';
const PUSHER_CLUSTER = process.env.NEXT_PUBLIC_PUSHER_CLUSTER || 'eu';
const CHANNEL_NAME = 'synapse-live';

interface UsePusherWatchProps {
  enabled: boolean;
  onSessionStart: (session: AgentSession) => void;
  onEvent: (event: AgentEvent) => void;
}

export function usePusherWatch({ enabled, onSessionStart, onEvent }: UsePusherWatchProps) {
  const pusherRef = useRef<Pusher | null>(null);
  const channelRef = useRef<ReturnType<Pusher['subscribe']> | null>(null);
  const sessionCreatedRef = useRef(false);
  const callbacksRef = useRef({ onSessionStart, onEvent });
  
  // Keep callbacks fresh
  callbacksRef.current = { onSessionStart, onEvent };

  const createSession = useCallback(() => {
    if (sessionCreatedRef.current) return;
    
    console.log('[Pusher] Creating session');
    const session: AgentSession = {
      id: `live-${Date.now()}`,
      name: '🤖 Bubbi (Live)',
      agent: 'bubbi',
      startedAt: new Date(),
      events: [],
    };
    callbacksRef.current.onSessionStart(session);
    sessionCreatedRef.current = true;
  }, []);

  useEffect(() => {
    if (!enabled || !PUSHER_KEY) {
      return;
    }

    // Already connected
    if (pusherRef.current) {
      return;
    }

    console.log('[Pusher] Initializing connection...');
    Pusher.logToConsole = true;

    const pusher = new Pusher(PUSHER_KEY, {
      cluster: PUSHER_CLUSTER,
    });
    pusherRef.current = pusher;

    const channel = pusher.subscribe(CHANNEL_NAME);
    channelRef.current = channel;

    pusher.connection.bind('connected', () => {
      console.log('[Pusher] ✅ Connected');
      createSession();
    });

    pusher.connection.bind('error', (err: Error) => {
      console.error('[Pusher] ❌ Error:', err);
    });

    channel.bind('pusher:subscription_succeeded', () => {
      console.log('[Pusher] ✅ Subscribed to', CHANNEL_NAME);
    });

    channel.bind('session-start', (data: { session: Partial<AgentSession> }) => {
      console.log('[Pusher] 📦 session-start received');
      if (!sessionCreatedRef.current) {
        const session: AgentSession = {
          id: data.session.id || `live-${Date.now()}`,
          name: data.session.name || '🤖 Bubbi (Live)',
          agent: 'bubbi',
          startedAt: new Date(),
          events: [],
        };
        callbacksRef.current.onSessionStart(session);
        sessionCreatedRef.current = true;
      }
    });

    channel.bind('event', (data: { event: AgentEvent }) => {
      console.log('[Pusher] 📨 event:', data.event.type);
      
      // Ensure session exists
      if (!sessionCreatedRef.current) {
        createSession();
      }
      
      const event: AgentEvent = {
        ...data.event,
        timestamp: new Date(data.event.timestamp),
      };
      callbacksRef.current.onEvent(event);
    });

    // Cleanup only when disabled or unmounting
    return () => {
      console.log('[Pusher] 🧹 Disconnecting');
      channel.unbind_all();
      pusher.unsubscribe(CHANNEL_NAME);
      pusher.disconnect();
      pusherRef.current = null;
      channelRef.current = null;
      sessionCreatedRef.current = false;
    };
  }, [enabled, createSession]);

  return {
    isConfigured: Boolean(PUSHER_KEY),
  };
}
