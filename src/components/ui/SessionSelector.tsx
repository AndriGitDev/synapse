'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { ChevronDown, Cpu, Zap } from 'lucide-react';
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
        className="flex items-center gap-3 bg-slate-900/90 backdrop-blur-xl hover:bg-slate-800/90 border border-slate-700/50 rounded-xl px-4 py-3 min-w-[260px] transition-all duration-200 shadow-lg"
      >
        <div className="p-2 bg-gradient-to-br from-indigo-500/20 to-purple-500/20 rounded-lg border border-indigo-500/20">
          <Zap className="w-4 h-4 text-indigo-400" />
        </div>
        <div className="flex-1 text-left">
          <div className="text-sm font-medium text-white truncate">
            {currentSession?.name || 'Select a session'}
          </div>
          {currentSession && (
            <div className="text-[11px] text-slate-500">
              {currentSession.events.length} events · {currentSession.agent}
            </div>
          )}
        </div>
        <ChevronDown className={`w-4 h-4 text-slate-500 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`} />
      </button>
      
      <AnimatePresence>
        {isOpen && (
          <>
            {/* Backdrop */}
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-40" 
              onClick={() => setIsOpen(false)} 
            />
            
            {/* Dropdown */}
            <motion.div
              initial={{ opacity: 0, y: -8, scale: 0.96 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -8, scale: 0.96 }}
              transition={{ duration: 0.15, ease: [0.23, 1, 0.32, 1] }}
              className="absolute top-full left-0 right-0 mt-2 bg-slate-900/95 backdrop-blur-xl border border-slate-700/50 rounded-xl shadow-2xl overflow-hidden z-50"
            >
              <div className="p-1">
                {sessions.map((session) => (
                  <button
                    key={session.id}
                    onClick={() => {
                      onSelect(session);
                      setIsOpen(false);
                    }}
                    className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all duration-150 ${
                      currentSession?.id === session.id 
                        ? 'bg-indigo-500/20 border border-indigo-500/30' 
                        : 'hover:bg-slate-800/80'
                    }`}
                  >
                    <div className={`p-1.5 rounded-lg ${
                      currentSession?.id === session.id 
                        ? 'bg-indigo-500/30' 
                        : 'bg-slate-800'
                    }`}>
                      <Cpu className={`w-3.5 h-3.5 ${
                        currentSession?.id === session.id 
                          ? 'text-indigo-300' 
                          : 'text-slate-500'
                      }`} />
                    </div>
                    <div className="flex-1 text-left">
                      <div className={`text-sm font-medium ${
                        currentSession?.id === session.id 
                          ? 'text-white' 
                          : 'text-slate-300'
                      }`}>
                        {session.name}
                      </div>
                      <div className="text-[11px] text-slate-500 truncate">
                        {session.description}
                      </div>
                    </div>
                    <div className="text-[11px] text-slate-500 tabular-nums">
                      {session.events.length}
                    </div>
                  </button>
                ))}
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}
