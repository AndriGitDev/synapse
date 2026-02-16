'use client';

import { useState, useCallback, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Zap, Wifi, WifiOff, Loader2, AlertCircle, X, Play } from 'lucide-react';
import { SynapseWebSocket } from '@/lib/websocket';
import { AgentSession, AgentEvent } from '@/lib/types';

type ConnectionStatus = 'disconnected' | 'connecting' | 'connected' | 'error';

interface LiveConnectionProps {
  onSessionStart: (session: AgentSession) => void;
  onEventReceived: (event: AgentEvent) => void;
}

export function LiveConnection({ onSessionStart, onEventReceived }: LiveConnectionProps) {
  const [url, setUrl] = useState('ws://localhost:8080/synapse');
  const [status, setStatus] = useState<ConnectionStatus>('disconnected');
  const [error, setError] = useState<string | null>(null);
  const [eventCount, setEventCount] = useState(0);
  const wsRef = useRef<SynapseWebSocket | null>(null);
  const eventsRef = useRef<AgentEvent[]>([]);

  const handleConnect = useCallback(() => {
    if (wsRef.current) {
      wsRef.current.disconnect();
    }

    eventsRef.current = [];
    setEventCount(0);
    setError(null);

    wsRef.current = new SynapseWebSocket({
      url,
      onStatusChange: setStatus,
      onError: setError,
      onSessionStart: (session) => {
        const newSession: AgentSession = {
          id: session.id,
          name: session.name || 'Live Session',
          description: 'Real-time agent session',
          agent: (session.agent as AgentSession['agent']) || 'generic',
          startedAt: new Date(),
          events: [],
        };
        eventsRef.current = [];
        onSessionStart(newSession);
      },
      onEvent: (event) => {
        eventsRef.current.push(event);
        setEventCount(eventsRef.current.length);
        onEventReceived(event);
      },
      onSessionEnd: () => {
        // Session ended, keep showing the final state
      },
    });

    wsRef.current.connect();
  }, [url, onSessionStart, onEventReceived]);

  const handleDisconnect = useCallback(() => {
    if (wsRef.current) {
      wsRef.current.disconnect();
      wsRef.current = null;
    }
  }, []);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (wsRef.current) {
        wsRef.current.disconnect();
      }
    };
  }, []);

  const statusConfig = {
    disconnected: { icon: WifiOff, color: 'text-slate-500', bg: 'bg-slate-500/10', label: 'Disconnected' },
    connecting: { icon: Loader2, color: 'text-amber-400', bg: 'bg-amber-500/10', label: 'Connecting...' },
    connected: { icon: Wifi, color: 'text-green-400', bg: 'bg-green-500/10', label: 'Connected' },
    error: { icon: AlertCircle, color: 'text-red-400', bg: 'bg-red-500/10', label: 'Error' },
  };

  const StatusIcon = statusConfig[status].icon;

  return (
    <div className="flex items-center justify-center h-full">
      <div className="w-full max-w-md p-8">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-br from-slate-800 to-slate-900 border border-slate-700 mb-6 relative">
            <Zap className="w-7 h-7 text-indigo-400" />
            <AnimatePresence>
              {status === 'connected' && (
                <motion.span
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  exit={{ scale: 0 }}
                  className="absolute -top-1 -right-1 w-4 h-4 bg-green-500 rounded-full border-2 border-slate-900"
                />
              )}
            </AnimatePresence>
          </div>
          <h2 className="text-xl font-semibold mb-2">Live Connection</h2>
          <p className="text-slate-500 text-sm">
            Connect to a running AI agent to watch its thinking in real-time.
          </p>
        </div>

        {/* Connection form */}
        <div className="space-y-4">
          {/* URL Input */}
          <div className="bg-slate-800/50 rounded-xl p-4 border border-slate-700/50">
            <label className="block text-sm text-slate-400 mb-2">
              WebSocket URL
            </label>
            <input
              type="text"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              placeholder="ws://localhost:8080/synapse"
              disabled={status === 'connecting' || status === 'connected'}
              className="w-full px-3 py-2.5 bg-slate-900/80 border border-slate-700 rounded-lg text-white placeholder-slate-600 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500/50 transition-all disabled:opacity-50"
            />
          </div>

          {/* Status indicator */}
          <div className={`flex items-center justify-between px-4 py-3 rounded-lg ${statusConfig[status].bg}`}>
            <div className="flex items-center gap-2">
              <StatusIcon className={`w-4 h-4 ${statusConfig[status].color} ${status === 'connecting' ? 'animate-spin' : ''}`} />
              <span className={`text-sm font-medium ${statusConfig[status].color}`}>
                {statusConfig[status].label}
              </span>
            </div>
            {status === 'connected' && (
              <span className="text-sm text-slate-400">
                {eventCount} events
              </span>
            )}
          </div>

          {/* Error message */}
          <AnimatePresence>
            {error && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="flex items-start gap-2 px-4 py-3 rounded-lg bg-red-500/10 border border-red-500/20"
              >
                <AlertCircle className="w-4 h-4 text-red-400 mt-0.5 flex-shrink-0" />
                <span className="text-sm text-red-300">{error}</span>
                <button
                  onClick={() => setError(null)}
                  className="ml-auto p-0.5 hover:bg-red-500/20 rounded"
                >
                  <X className="w-3 h-3 text-red-400" />
                </button>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Action buttons */}
          {status === 'disconnected' || status === 'error' ? (
            <button
              onClick={handleConnect}
              className="w-full flex items-center justify-center gap-2 px-6 py-3 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 rounded-lg font-medium transition-all shadow-lg shadow-indigo-500/20"
            >
              <Play className="w-4 h-4" />
              Connect
            </button>
          ) : status === 'connecting' ? (
            <button
              onClick={handleDisconnect}
              className="w-full flex items-center justify-center gap-2 px-6 py-3 bg-slate-700 hover:bg-slate-600 rounded-lg font-medium transition-all"
            >
              <X className="w-4 h-4" />
              Cancel
            </button>
          ) : (
            <button
              onClick={handleDisconnect}
              className="w-full flex items-center justify-center gap-2 px-6 py-3 bg-slate-700 hover:bg-slate-600 rounded-lg font-medium transition-all"
            >
              <WifiOff className="w-4 h-4" />
              Disconnect
            </button>
          )}
        </div>

        {/* Help text */}
        <div className="mt-6 text-center">
          <p className="text-xs text-slate-500">
            Compatible with Clawdbot&apos;s SYNAPSE output mode
          </p>
        </div>
      </div>
    </div>
  );
}
