'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { Sparkles, Loader2, Check, Clock, ChevronUp, Send } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

type TriggerState = 'idle' | 'loading' | 'accepted' | 'rejected' | 'error';

const DEMO_COMMANDS = [
  { label: '🔍 Cybersecurity news today', emoji: '🔍' },
  { label: '🌍 Random country, obscure fact', emoji: '🌍' },
  { label: '🚀 Latest space news', emoji: '🚀' },
  { label: '🎲 Haiku about right now', emoji: '🎲' },
  { label: '📅 On this day in history...', emoji: '📅' },
];

interface TriggerButtonProps {
  onTriggerRejected?: (reason: string) => void;
}

export function TriggerButton({ onTriggerRejected }: TriggerButtonProps) {
  const [state, setState] = useState<TriggerState>('idle');
  const [message, setMessage] = useState('');
  const [countdown, setCountdown] = useState(0);
  const [isOpen, setIsOpen] = useState(false);
  const [loadingIndex, setLoadingIndex] = useState<number | null>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (countdown <= 0) return;
    const timer = setInterval(() => {
      setCountdown(c => {
        if (c <= 1) {
          setState('idle');
          setMessage('');
          return 0;
        }
        return c - 1;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, [countdown]);

  // Close dropdown on outside click
  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  const trigger = useCallback(async (taskIndex: number) => {
    if (state === 'loading' || countdown > 0) return;
    setState('loading');
    setLoadingIndex(taskIndex);
    setMessage('');
    setIsOpen(false);

    try {
      const res = await fetch('/api/trigger', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ taskIndex }),
      });
      const data = await res.json();

      if (data.ok) {
        setState('accepted');
        setMessage(`${DEMO_COMMANDS[taskIndex].emoji} Task sent! Watch the graph...`);
        setTimeout(() => { setState('idle'); setMessage(''); }, 8000);
      } else if (data.error === 'rate_limited') {
        setState('rejected');
        setMessage(`Bubbi is resting. Try again in ${data.retryAfter}s`);
        setCountdown(data.retryAfter || 120);
        onTriggerRejected?.('rate_limited');
      } else {
        setState('error');
        setMessage(data.error || 'Something went wrong');
        setTimeout(() => { setState('idle'); setMessage(''); }, 5000);
      }
    } catch {
      setState('error');
      setMessage('Connection failed');
      setTimeout(() => { setState('idle'); setMessage(''); }, 5000);
    } finally {
      setLoadingIndex(null);
    }
  }, [state, countdown, onTriggerRejected]);

  const isDisabled = state === 'loading' || countdown > 0;

  return (
    <div className="flex flex-col items-center gap-3" ref={dropdownRef}>
      <div className="relative">
        {/* Dropdown menu - opens upward */}
        <AnimatePresence>
          {isOpen && (
            <motion.div
              initial={{ opacity: 0, y: 10, scaleY: 0.95 }}
              animate={{ opacity: 1, y: 0, scaleY: 1 }}
              exit={{ opacity: 0, y: 10, scaleY: 0.95 }}
              transition={{ duration: 0.15 }}
              className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-72 bg-slate-800/95 backdrop-blur-xl border border-slate-700 rounded-xl overflow-hidden shadow-2xl z-50"
            >
              <div className="px-3 py-2 border-b border-slate-700/50">
                <p className="text-[11px] text-slate-500 font-medium uppercase tracking-wider">Choose a task for Bubbi</p>
              </div>
              {DEMO_COMMANDS.map((cmd, i) => (
                <button
                  key={i}
                  onClick={() => trigger(i)}
                  disabled={isDisabled}
                  className="w-full flex items-center gap-3 px-4 py-2.5 hover:bg-violet-500/10 transition-colors text-left disabled:opacity-50 border-b border-slate-700/30 last:border-0"
                >
                  {loadingIndex === i ? (
                    <Loader2 className="w-4 h-4 animate-spin text-violet-400 flex-shrink-0" />
                  ) : (
                    <Send className="w-3.5 h-3.5 text-slate-600 flex-shrink-0" />
                  )}
                  <span className="text-sm text-slate-200">{cmd.label}</span>
                </button>
              ))}
            </motion.div>
          )}
        </AnimatePresence>

        {/* Main button */}
        <motion.button
          onClick={() => {
            if (!isDisabled) setIsOpen(!isOpen);
          }}
          disabled={isDisabled}
          whileHover={isDisabled ? {} : { scale: 1.05 }}
          whileTap={isDisabled ? {} : { scale: 0.95 }}
          className={`
            relative px-6 py-3 rounded-xl font-semibold text-sm transition-all duration-300
            flex items-center gap-2 shadow-lg
            ${state === 'accepted'
              ? 'bg-gradient-to-r from-green-600 to-emerald-600 text-white shadow-green-500/30'
              : state === 'rejected' || countdown > 0
                ? 'bg-slate-700 text-slate-400 cursor-not-allowed'
                : state === 'loading'
                  ? 'bg-gradient-to-r from-violet-600 to-purple-600 text-white/70 cursor-wait'
                  : 'bg-gradient-to-r from-violet-600 to-purple-600 hover:from-violet-500 hover:to-purple-500 text-white shadow-violet-500/30 hover:shadow-violet-500/50'
            }
          `}
        >
          {state === 'loading' && <Loader2 className="w-4 h-4 animate-spin" />}
          {state === 'accepted' && <Check className="w-4 h-4" />}
          {(state === 'rejected' || countdown > 0) && <Clock className="w-4 h-4" />}
          {state === 'idle' && <Sparkles className="w-4 h-4" />}
          {state === 'error' && <Sparkles className="w-4 h-4" />}

          {countdown > 0
            ? `Try again in ${countdown}s`
            : state === 'accepted'
              ? 'Task Sent!'
              : '✨ Make Bubbi Think'
          }
          
          {state === 'idle' && (
            <ChevronUp className={`w-3.5 h-3.5 ml-1 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
          )}
        </motion.button>
      </div>

      <AnimatePresence>
        {message && (
          <motion.p
            initial={{ opacity: 0, y: -5 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -5 }}
            className={`text-xs ${
              state === 'accepted' ? 'text-green-400' :
              state === 'rejected' ? 'text-amber-400' :
              'text-slate-500'
            }`}
          >
            {message}
          </motion.p>
        )}
      </AnimatePresence>

      <div className="flex items-center gap-2 px-4 py-2 rounded-lg bg-amber-500/10 border border-amber-500/20">
        <Clock className="w-3.5 h-3.5 text-amber-400 flex-shrink-0" />
        <p className="text-xs text-amber-300/90">
          Bubbi runs on free-tier models with rate limits — expect 1–3 min for full responses.
        </p>
      </div>
    </div>
  );
}
