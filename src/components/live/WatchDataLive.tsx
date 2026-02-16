'use client';

import { useState, useCallback, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Eye, Wifi, WifiOff, Loader2, AlertCircle, Bot, Sparkles, ChevronDown, Zap, Send } from 'lucide-react';
import { connectToLiveStream, isLiveStreamConfigured } from '@/lib/pusher-client';
import { AgentSession, AgentEvent } from '@/lib/types';
import Pusher from 'pusher-js';

type ConnectionStatus = 'disconnected' | 'connecting' | 'connected' | 'error' | 'waiting';

interface WatchDataLiveProps {
  onSessionStart: (session: AgentSession) => void;
  onEventReceived: (event: AgentEvent) => void;
}

const DEMO_COMMANDS = [
  {
    label: '🔍 What\'s trending in cybersecurity today?',
    emoji: '🔍',
  },
  {
    label: '🌍 Random country, obscure fact',
    emoji: '🌍',
  },
  {
    label: '🚀 Latest space news',
    emoji: '🚀',
  },
  {
    label: '🎲 Generate a haiku about right now',
    emoji: '🎲',
  },
  {
    label: '📅 On this day in history...',
    emoji: '📅',
  },
];

const PUSHER_KEY = process.env.NEXT_PUBLIC_PUSHER_KEY || '';
const PUSHER_CLUSTER = process.env.NEXT_PUBLIC_PUSHER_CLUSTER || 'eu';

export function WatchDataLive({ onSessionStart, onEventReceived }: WatchDataLiveProps) {
  const [status, setStatus] = useState<ConnectionStatus>('disconnected');
  const [error, setError] = useState<string | null>(null);
  const [eventCount, setEventCount] = useState(0);
  const [lastActivity, setLastActivity] = useState<Date | null>(null);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [triggerLoading, setTriggerLoading] = useState<number | null>(null);
  const [triggerStatus, setTriggerStatus] = useState<string | null>(null);
  const disconnectRef = useRef<(() => void) | null>(null);
  const eventsRef = useRef<AgentEvent[]>([]);
  const sessionRef = useRef<AgentSession | null>(null);
  const controlPusherRef = useRef<Pusher | null>(null);

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

    // Set up control channel for triggers
    if (!controlPusherRef.current && PUSHER_KEY) {
      const controlPusher = new Pusher(PUSHER_KEY, { cluster: PUSHER_CLUSTER });
      const controlChannel = controlPusher.subscribe('synapse-control');
      const liveChannel = controlPusher.subscribe('synapse-live');

      liveChannel.bind('trigger-accepted', (data: { hint: string }) => {
        setTriggerStatus(`✅ ${data.hint}`);
        setTriggerLoading(null);
      });

      liveChannel.bind('trigger-rejected', (data: { message: string }) => {
        setTriggerStatus(`⏳ ${data.message}`);
        setTriggerLoading(null);
      });

      controlPusherRef.current = controlPusher;
      void controlChannel; // keep subscription alive
    }

    const disconnect = connectToLiveStream({
      onSessionStart: (session) => {
        sessionRef.current = session;
        eventsRef.current = [];
        setStatus('connected');
        setLastActivity(new Date());
        onSessionStart(session);
      },
      onEvent: (event) => {
        if (!sessionRef.current) {
          const session: AgentSession = {
            id: `live-${Date.now()}`,
            name: '🤖 Bubbi (Live)',
            agent: 'generic',
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
    if (controlPusherRef.current) {
      controlPusherRef.current.disconnect();
      controlPusherRef.current = null;
    }
    sessionRef.current = null;
    setStatus('disconnected');
  }, []);

  const handleTrigger = useCallback(async (index: number) => {
    setTriggerLoading(index);
    setTriggerStatus(null);
    setIsDropdownOpen(false);

    try {
      // Trigger via Pusher control channel
      // We need to send a server-side event. Use the API route as a relay.
      const resp = await fetch('/api/trigger', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ taskIndex: index }),
      });

      if (!resp.ok) {
        const data = await resp.json();
        setTriggerStatus(`❌ ${data.error || 'Failed to trigger'}`);
        setTriggerLoading(null);
      }
      // Success status will come via Pusher trigger-accepted event
    } catch {
      setTriggerStatus('❌ Network error');
      setTriggerLoading(null);
    }
  }, []);

  useEffect(() => {
    const handleBeforeUnload = () => {
      if (disconnectRef.current) {
        disconnectRef.current();
      }
      if (controlPusherRef.current) {
        controlPusherRef.current.disconnect();
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
  const isConnected = status === 'connected' || status === 'waiting';

  return (
    <div className="flex items-center justify-center h-full">
      <div className="w-full max-w-md p-8">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-20 h-20 rounded-2xl bg-gradient-to-br from-violet-600 to-purple-700 border border-violet-500/30 mb-6 relative shadow-xl shadow-violet-500/20">
            <Bot className="w-10 h-10 text-white" />
            <AnimatePresence>
              {isConnected && (
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
            Connect and send a command to watch an AI agent reason in real-time.
          </p>
        </div>

        {/* Info card */}
        <div className="bg-gradient-to-br from-violet-500/10 to-purple-500/10 rounded-xl p-4 border border-violet-500/20 mb-6">
          <div className="flex items-start gap-3">
            <Sparkles className="w-5 h-5 text-violet-400 mt-0.5 flex-shrink-0" />
            <div>
              <p className="text-sm text-slate-300 mb-1">
                This is a live feed of real AI reasoning.
              </p>
              <p className="text-xs text-slate-500">
                Pick a command below to trigger Bubbi. You&apos;ll see every thought, tool call, and decision as it happens.
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
        {lastActivity && isConnected && (
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

        {/* Trigger status */}
        <AnimatePresence>
          {triggerStatus && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="text-center text-sm mb-4 text-slate-300"
            >
              {triggerStatus}
            </motion.div>
          )}
        </AnimatePresence>

        {/* Connect / Disconnect button */}
        {status === 'disconnected' || status === 'error' ? (
          <button
            onClick={handleConnect}
            className="w-full flex items-center justify-center gap-2 px-6 py-3.5 bg-gradient-to-r from-violet-600 to-purple-600 hover:from-violet-500 hover:to-purple-500 rounded-xl font-semibold transition-all shadow-lg shadow-violet-500/25 hover:shadow-violet-500/40 mb-3"
          >
            <Eye className="w-5 h-5" />
            Start Watching
          </button>
        ) : (
          <button
            onClick={handleDisconnect}
            className="w-full flex items-center justify-center gap-2 px-6 py-3.5 bg-slate-700 hover:bg-slate-600 rounded-xl font-medium transition-all mb-3"
          >
            <WifiOff className="w-4 h-4" />
            Stop Watching
          </button>
        )}

        {/* Command dropdown */}
        {isConnected && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="relative"
          >
            <button
              onClick={() => setIsDropdownOpen(!isDropdownOpen)}
              disabled={triggerLoading !== null}
              className="w-full flex items-center justify-between gap-2 px-5 py-3.5 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 disabled:opacity-50 rounded-xl font-semibold transition-all shadow-lg shadow-emerald-500/25 hover:shadow-emerald-500/40"
            >
              <div className="flex items-center gap-2">
                <Zap className="w-5 h-5" />
                {triggerLoading !== null ? 'Sending...' : 'Make Bubbi Think'}
              </div>
              <ChevronDown className={`w-4 h-4 transition-transform ${isDropdownOpen ? 'rotate-180' : ''}`} />
            </button>

            <AnimatePresence>
              {isDropdownOpen && (
                <motion.div
                  initial={{ opacity: 0, y: -5, scaleY: 0.95 }}
                  animate={{ opacity: 1, y: 0, scaleY: 1 }}
                  exit={{ opacity: 0, y: -5, scaleY: 0.95 }}
                  transition={{ duration: 0.15 }}
                  className="absolute bottom-full left-0 right-0 mb-2 bg-slate-800 border border-slate-700 rounded-xl overflow-hidden shadow-2xl z-50"
                >
                  {DEMO_COMMANDS.map((cmd, i) => (
                    <button
                      key={i}
                      onClick={() => handleTrigger(i)}
                      disabled={triggerLoading !== null}
                      className="w-full flex items-center gap-3 px-4 py-3 hover:bg-slate-700/80 transition-colors text-left disabled:opacity-50 border-b border-slate-700/50 last:border-0"
                    >
                      {triggerLoading === i ? (
                        <Loader2 className="w-4 h-4 animate-spin text-emerald-400 flex-shrink-0" />
                      ) : (
                        <Send className="w-4 h-4 text-slate-500 flex-shrink-0" />
                      )}
                      <span className="text-sm text-slate-200">{cmd.label}</span>
                    </button>
                  ))}
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        )}

        {/* Hint */}
        <div className="mt-6 text-center">
          <p className="text-xs text-slate-600">
            {isConnected 
              ? 'Pick a command to trigger Bubbi — events stream in real-time via Pusher'
              : 'Events stream in real-time via Pusher'
            }
          </p>
        </div>
      </div>
    </div>
  );
}
