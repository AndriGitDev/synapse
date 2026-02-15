'use client';

import { useState, useCallback, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Eye, Wifi, WifiOff, Loader2, AlertCircle, Bot, Sparkles } from 'lucide-react';
import { connectToLiveStream, isLiveStreamConfigured } from '@/lib/pusher-client';
import { AgentSession, AgentEvent } from '@/lib/types';

type ConnectionStatus = 'disconnected' | 'connecting' | 'connected' | 'error' | 'waiting';

interface WatchDataLiveProps {
  onSessionStart: (session: AgentSession) => void;
  onEventReceived: (event: AgentEvent) => void;
}

export function WatchDataLive({ onSessionStart, onEventReceived }: WatchDataLiveProps) {
  const [status, setStatus] = useState<ConnectionStatus>('disconnected');
  const [error, setError] = useState<string | null>(null);
  const [eventCount, setEventCount] = useState(0);
  const [lastActivity, setLastActivity] = useState<Date | null>(null);
  const disconnectRef = useRef<(() => void) | null>(null);
  const eventsRef = useRef<AgentEvent[]>([]);
  const sessionRef = useRef<AgentSession | null>(null);

  const handleConnect = useCallback(() => {
    if (!isLiveStreamConfigured()) {
      setError('Live stream not configured. Contact the site admin.');
      setStatus('error');
      return;
    }

    setStatus('connecting');
    setError(null);
    eventsRef.current = [];
    setEventCount(0);

    const disconnect = connectToLiveStream({
      onSessionStart: (session) => {
        sessionRef.current = session;
        eventsRef.current = [];
        setStatus('connected');
        setLastActivity(new Date());
        onSessionStart(session);
      },
      onEvent: (event) => {
        // If we get an event but no session yet, create one
        if (!sessionRef.current) {
          const session: AgentSession = {
            id: `live-${Date.now()}`,
            name: '🤖 Bubbi (Live)',
            agent: 'bubbi',
            startedAt: new Date(),
            events: [],
          };
          sessionRef.current = session;
          onSessionStart(session);
        }
        
        eventsRef.current.push(event);
        setEventCount(eventsRef.current.length);
        setLastActivity(new Date());
        setStatus('connected');
        onEventReceived(event);
      },
      onSessionEnd: () => {
        setStatus('waiting');
      },
      onError: (err) => {
        setError(err.message);
        setStatus('error');
      },
    });

    disconnectRef.current = disconnect;
    
    // After connecting, we're waiting for activity
    setTimeout(() => {
      if (status === 'connecting') {
        setStatus('waiting');
      }
    }, 2000);
  }, [onSessionStart, onEventReceived, status]);

  const handleDisconnect = useCallback(() => {
    if (disconnectRef.current) {
      disconnectRef.current();
      disconnectRef.current = null;
    }
    sessionRef.current = null;
    setStatus('disconnected');
  }, []);

  // DON'T cleanup on unmount - the connection should persist when switching to graph view
  // The connection will be cleaned up when the user explicitly disconnects or leaves the page
  useEffect(() => {
    const handleBeforeUnload = () => {
      if (disconnectRef.current) {
        disconnectRef.current();
      }
    };
    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
    };
  }, []);

  const statusConfig = {
    disconnected: { icon: WifiOff, color: 'text-slate-500', bg: 'bg-slate-500/10', label: 'Not watching' },
    connecting: { icon: Loader2, color: 'text-amber-400', bg: 'bg-amber-500/10', label: 'Connecting...' },
    connected: { icon: Wifi, color: 'text-green-400', bg: 'bg-green-500/10', label: 'Receiving events' },
    waiting: { icon: Eye, color: 'text-blue-400', bg: 'bg-blue-500/10', label: 'Waiting for activity...' },
    error: { icon: AlertCircle, color: 'text-red-400', bg: 'bg-red-500/10', label: 'Connection error' },
  };

  const StatusIcon = statusConfig[status].icon;

  return (
    <div className="flex items-center justify-center h-full">
      <div className="w-full max-w-md p-8">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-20 h-20 rounded-2xl bg-gradient-to-br from-violet-600 to-purple-700 border border-violet-500/30 mb-6 relative shadow-xl shadow-violet-500/20">
            <Bot className="w-10 h-10 text-white" />
            <AnimatePresence>
              {(status === 'connected' || status === 'waiting') && (
                <motion.span
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  exit={{ scale: 0 }}
                  className={`absolute -top-1 -right-1 w-5 h-5 rounded-full border-2 border-slate-900 flex items-center justify-center ${
                    status === 'connected' ? 'bg-green-500' : 'bg-blue-500'
                  }`}
                >
                  {status === 'connected' && (
                    <motion.span
                      animate={{ scale: [1, 1.3, 1] }}
                      transition={{ repeat: Infinity, duration: 1.5 }}
                      className="w-2 h-2 bg-white rounded-full"
                    />
                  )}
                </motion.span>
              )}
            </AnimatePresence>
          </div>
          <h2 className="text-2xl font-bold mb-2">Watch Bubbi Think</h2>
          <p className="text-slate-400 text-sm">
            Connect to watch my thought process in real-time as I work on tasks.
          </p>
        </div>

        {/* Info card */}
        <div className="bg-gradient-to-br from-violet-500/10 to-purple-500/10 rounded-xl p-4 border border-violet-500/20 mb-6">
          <div className="flex items-start gap-3">
            <Sparkles className="w-5 h-5 text-violet-400 mt-0.5 flex-shrink-0" />
            <div>
              <p className="text-sm text-slate-300 mb-1">
                This is a live feed of my actual reasoning.
              </p>
              <p className="text-xs text-slate-500">
                You&apos;ll see thoughts, tool calls, and decisions as they happen when I&apos;m actively working.
              </p>
            </div>
          </div>
        </div>

        {/* Status indicator */}
        <div className={`flex items-center justify-between px-4 py-3 rounded-lg mb-4 ${statusConfig[status].bg}`}>
          <div className="flex items-center gap-2">
            <StatusIcon className={`w-4 h-4 ${statusConfig[status].color} ${status === 'connecting' ? 'animate-spin' : ''}`} />
            <span className={`text-sm font-medium ${statusConfig[status].color}`}>
              {statusConfig[status].label}
            </span>
          </div>
          {eventCount > 0 && (
            <span className="text-sm text-slate-400">
              {eventCount} events
            </span>
          )}
        </div>

        {/* Last activity */}
        {lastActivity && (status === 'connected' || status === 'waiting') && (
          <div className="text-center text-xs text-slate-500 mb-4">
            Last activity: {lastActivity.toLocaleTimeString()}
          </div>
        )}

        {/* Error message */}
        <AnimatePresence>
          {error && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="flex items-start gap-2 px-4 py-3 rounded-lg bg-red-500/10 border border-red-500/20 mb-4"
            >
              <AlertCircle className="w-4 h-4 text-red-400 mt-0.5 flex-shrink-0" />
              <span className="text-sm text-red-300">{error}</span>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Action buttons */}
        {status === 'disconnected' || status === 'error' ? (
          <button
            onClick={handleConnect}
            className="w-full flex items-center justify-center gap-2 px-6 py-3.5 bg-gradient-to-r from-violet-600 to-purple-600 hover:from-violet-500 hover:to-purple-500 rounded-xl font-semibold transition-all shadow-lg shadow-violet-500/25 hover:shadow-violet-500/40"
          >
            <Eye className="w-5 h-5" />
            Start Watching
          </button>
        ) : (
          <button
            onClick={handleDisconnect}
            className="w-full flex items-center justify-center gap-2 px-6 py-3.5 bg-slate-700 hover:bg-slate-600 rounded-xl font-medium transition-all"
          >
            <WifiOff className="w-4 h-4" />
            Stop Watching
          </button>
        )}

        {/* Hint */}
        <div className="mt-6 text-center">
          <p className="text-xs text-slate-500">
            Events stream in real-time via Pusher
          </p>
        </div>
      </div>
    </div>
  );
}
