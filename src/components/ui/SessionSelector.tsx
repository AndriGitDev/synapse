'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { ChevronDown, Play, Clock, Cpu } from 'lucide-react';
import { useState } from 'react';
import { AgentSession } from '@/lib/types';

interface SessionSelectorProps {
  sessions: AgentSession[];
  currentSession: AgentSession | null;
  onSelect: (session: AgentSession) => void;
}

export function SessionSelector({ sessions, currentSession, onSelect }: SessionSelectorProps) {
  const [isOpen, setIsOpen] = useState(false);
  
  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-3 bg-slate-800/80 hover:bg-slate-700 border border-slate-700 rounded-lg px-4 py-3 min-w-[280px] transition-colors"
      >
        <div className="p-2 bg-indigo-500/20 rounded-lg">
          <Play className="w-4 h-4 text-indigo-400" />
        </div>
        <div className="flex-1 text-left">
          <div className="text-sm font-medium text-white">
            {currentSession?.name || 'Select a session'}
          </div>
          {currentSession && (
            <div className="text-xs text-slate-400">
              {currentSession.events.length} events
            </div>
          )}
        </div>
        <ChevronDown className={`w-4 h-4 text-slate-400 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </button>
      
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.15 }}
            className="absolute top-full left-0 right-0 mt-2 bg-slate-800 border border-slate-700 rounded-lg shadow-xl overflow-hidden z-50"
          >
            {sessions.map((session) => (
              <button
                key={session.id}
                onClick={() => {
                  onSelect(session);
                  setIsOpen(false);
                }}
                className={`w-full flex items-center gap-3 px-4 py-3 hover:bg-slate-700 transition-colors ${
                  currentSession?.id === session.id ? 'bg-slate-700/50' : ''
                }`}
              >
                <div className="p-2 bg-slate-700 rounded-lg">
                  <Cpu className="w-4 h-4 text-slate-400" />
                </div>
                <div className="flex-1 text-left">
                  <div className="text-sm font-medium text-white">{session.name}</div>
                  <div className="text-xs text-slate-400">{session.description}</div>
                </div>
                <div className="flex items-center gap-1 text-xs text-slate-500">
                  <Clock className="w-3 h-3" />
                  {session.events.length}
                </div>
              </button>
            ))}
          </motion.div>
        )}
      </AnimatePresence>
      
      {/* Backdrop to close dropdown */}
      {isOpen && (
        <div 
          className="fixed inset-0 z-40" 
          onClick={() => setIsOpen(false)} 
        />
      )}
    </div>
  );
}
