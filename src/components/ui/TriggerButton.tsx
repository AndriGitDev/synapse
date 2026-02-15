'use client';

import { useState, useEffect, useCallback } from 'react';
import { Sparkles, Loader2, Check, Clock } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

type TriggerState = 'idle' | 'loading' | 'accepted' | 'rejected' | 'error';

interface TriggerButtonProps {
  onTriggerRejected?: (reason: string) => void;
}

export function TriggerButton({ onTriggerRejected }: TriggerButtonProps) {
  const [state, setState] = useState<TriggerState>('idle');
  const [message, setMessage] = useState('');
  const [countdown, setCountdown] = useState(0);

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

  const trigger = useCallback(async () => {
    if (state === 'loading' || countdown > 0) return;
    setState('loading');
    setMessage('');

    try {
      const res = await fetch('/api/trigger', { method: 'POST' });
      const data = await res.json();

      if (data.ok) {
        setState('accepted');
        setMessage('Task sent! Watch the graph...');
        setTimeout(() => { setState('idle'); setMessage(''); }, 8000);
      } else if (data.error === 'rate_limited') {
        setState('rejected');
        setMessage(`Bubbi is resting. Try again in ${data.retryAfter}s`);
        setCountdown(data.retryAfter || 120);
      } else {
        setState('error');
        setMessage('Something went wrong');
        setTimeout(() => { setState('idle'); setMessage(''); }, 5000);
      }
    } catch {
      setState('error');
      setMessage('Connection failed');
      setTimeout(() => { setState('idle'); setMessage(''); }, 5000);
    }
  }, [state, countdown]);

  const isDisabled = state === 'loading' || countdown > 0;

  return (
    <div className="flex flex-col items-center gap-3">
      <motion.button
        onClick={trigger}
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
      </motion.button>

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
    </div>
  );
}
