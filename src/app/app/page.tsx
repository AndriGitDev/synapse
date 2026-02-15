'use client';

import { useEffect, useMemo, useCallback, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { ReactFlowProvider } from 'reactflow';
import { Brain, Upload, Github, Sparkles, Zap, Eye, Menu, X } from 'lucide-react';
import { SynapseGraph } from '@/components/graph/SynapseGraph';
import { PlaybackControls } from '@/components/controls/PlaybackControls';
import { SessionSelector } from '@/components/ui/SessionSelector';
import { EventDetail } from '@/components/ui/EventDetail';
import { FileUpload } from '@/components/ui/FileUpload';
import { LiveConnection } from '@/components/live/LiveConnection';
import { useSynapseStore } from '@/lib/store';
import { usePusherWatch } from '@/lib/usePusherWatch';
import { demoSessions } from '@/data/demo-sessions/building-website';
import { AgentSession, AgentEvent } from '@/lib/types';
import Link from 'next/link';

type Mode = 'demo' | 'upload' | 'live' | 'watch';

const MODES: { id: Mode; label: string; icon: typeof Sparkles; prominent?: boolean }[] = [
  { id: 'watch', label: 'Watch Bubbi', icon: Eye, prominent: true },
  { id: 'demo', label: 'Demo', icon: Sparkles },
  { id: 'upload', label: 'Upload', icon: Upload },
  { id: 'live', label: 'Live', icon: Zap },
];

export default function AppPage() {
  const [menuOpen, setMenuOpen] = useState(false);
  const searchParams = useSearchParams();
  const { 
    mode, setMode, session, setSession, reset, 
    selectedEventId, setSelectedEventId,
    playback, addLiveEvent, setLiveMode,
  } = useSynapseStore();
  
  // Handle ?mode= query param on mount
  useEffect(() => {
    const modeParam = searchParams.get('mode') as Mode | null;
    if (modeParam && ['demo', 'upload', 'live', 'watch'].includes(modeParam)) {
      handleModeChange(modeParam);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (mode === 'demo' && !session) {
      setSession(demoSessions[0]);
    }
  }, [mode, session, setSession]);
  
  const handleModeChange = (newMode: Mode) => {
    setMode(newMode);
    reset();
    setSelectedEventId(null);
    setLiveMode(newMode === 'live' || newMode === 'watch');
    if (newMode === 'demo') {
      setSession(demoSessions[0]);
    } else {
      setSession(null);
    }
    setMenuOpen(false);
  };
  
  const handleSessionChange = (newSession: typeof demoSessions[0]) => {
    reset();
    setSelectedEventId(null);
    setSession(newSession);
  };
  
  const selectedEvent = useMemo(() => {
    if (!session || !selectedEventId) return null;
    return session.events.find(e => e.id === selectedEventId) || null;
  }, [session, selectedEventId]);
  
  const handleLiveSessionStart = useCallback((newSession: AgentSession) => {
    setSession(newSession);
    setLiveMode(true);
  }, [setSession, setLiveMode]);
  
  const handleLiveEvent = useCallback((event: AgentEvent) => {
    addLiveEvent(event);
  }, [addLiveEvent]);

  usePusherWatch({
    enabled: mode === 'watch',
    onSessionStart: handleLiveSessionStart,
    onEvent: handleLiveEvent,
  });

  const isLiveStreaming = (mode === 'live' || mode === 'watch') && session;
  
  return (
    <div className="flex flex-col h-screen bg-slate-950 text-white overflow-hidden">
      {/* Header */}
      <header className="flex items-center justify-between px-4 sm:px-5 py-3 border-b border-slate-800/80 bg-slate-900/60 backdrop-blur-xl z-20">
        <Link href="/" className="flex items-center gap-3">
          <div className="relative">
            <div className="absolute inset-0 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-xl blur-md opacity-50" />
            <div className="relative p-2 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-xl">
              <Brain className="w-5 h-5 text-white" />
            </div>
          </div>
          <div className="hidden sm:block">
            <h1 className="text-lg font-bold tracking-tight flex items-center gap-2">
              SYNAPSE
              <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-indigo-500/20 text-indigo-300 font-medium">BETA</span>
            </h1>
            <p className="text-[11px] text-slate-500">Watch AI Agents Think</p>
          </div>
        </Link>
        
        {/* Desktop mode tabs */}
        <div className="hidden md:flex items-center bg-slate-800/40 rounded-lg p-1 border border-slate-700/50">
          {MODES.map((m) => (
            <button
              key={m.id}
              onClick={() => handleModeChange(m.id)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm font-medium transition-all duration-200 ${
                mode === m.id
                  ? m.prominent
                    ? 'bg-gradient-to-r from-violet-600 to-purple-600 text-white shadow-lg shadow-violet-500/20'
                    : 'bg-gradient-to-r from-indigo-600 to-purple-600 text-white shadow-lg shadow-indigo-500/20'
                  : m.prominent
                    ? 'text-violet-300 hover:text-white hover:bg-violet-700/30'
                    : 'text-slate-400 hover:text-white hover:bg-slate-700/50'
              }`}
            >
              <m.icon className="w-3.5 h-3.5" />
              {m.label}
              {m.prominent && isLiveStreaming && (
                <span className="w-2 h-2 bg-violet-400 rounded-full animate-pulse" />
              )}
            </button>
          ))}
        </div>

        {/* Mobile hamburger + GitHub */}
        <div className="flex items-center gap-2">
          <a
            href="https://github.com/AndriGitDev/synapse"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-2 px-3 py-1.5 text-slate-500 hover:text-white transition-colors rounded-lg hover:bg-slate-800/50"
          >
            <Github className="w-4 h-4" />
            <span className="text-sm hidden sm:inline">Source</span>
          </a>
          <button
            onClick={() => setMenuOpen(!menuOpen)}
            className="md:hidden p-2 text-slate-400 hover:text-white hover:bg-slate-800/50 rounded-lg transition-colors"
          >
            {menuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
      </header>

      {/* Mobile menu overlay */}
      {menuOpen && (
        <div className="md:hidden absolute top-[57px] left-0 right-0 z-30 bg-slate-900/95 backdrop-blur-xl border-b border-slate-800 p-3 space-y-1">
          {MODES.map((m) => (
            <button
              key={m.id}
              onClick={() => handleModeChange(m.id)}
              className={`flex items-center gap-3 w-full px-4 py-3 rounded-xl text-sm font-medium transition-all ${
                mode === m.id
                  ? m.prominent
                    ? 'bg-gradient-to-r from-violet-600 to-purple-600 text-white'
                    : 'bg-gradient-to-r from-indigo-600 to-purple-600 text-white'
                  : 'text-slate-400 hover:text-white hover:bg-slate-800'
              }`}
            >
              <m.icon className="w-5 h-5" />
              {m.label}
              {m.prominent && isLiveStreaming && (
                <span className="w-2 h-2 bg-violet-400 rounded-full animate-pulse ml-auto" />
              )}
            </button>
          ))}
        </div>
      )}
      
      {/* Main content */}
      <main className="flex-1 overflow-hidden relative" onClick={() => menuOpen && setMenuOpen(false)}>
        {mode === 'demo' && (
          <ReactFlowProvider>
            <SynapseGraph />
          </ReactFlowProvider>
        )}
        
        {mode === 'upload' && !session && (
          <div className="flex items-center justify-center h-full">
            <div className="text-center p-8">
              <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-br from-slate-800 to-slate-900 border border-slate-700 mb-6">
                <Upload className="w-7 h-7 text-slate-400" />
              </div>
              <h2 className="text-xl font-semibold mb-2">Upload Agent Logs</h2>
              <p className="text-slate-500 mb-8 max-w-sm">
                Drag and drop your session files to visualize how your AI agent thinks.
              </p>
              <FileUpload onSessionLoaded={(s) => setSession(s)} />
            </div>
          </div>
        )}
        
        {mode === 'upload' && session && (
          <ReactFlowProvider>
            <SynapseGraph />
          </ReactFlowProvider>
        )}
        
        {mode === 'live' && !session && (
          <LiveConnection
            onSessionStart={handleLiveSessionStart}
            onEventReceived={handleLiveEvent}
          />
        )}
        
        {mode === 'live' && session && (
          <ReactFlowProvider>
            <SynapseGraph />
          </ReactFlowProvider>
        )}
        
        {/* Watch Bubbi - enhanced waiting screen */}
        {mode === 'watch' && !session && (
          <div className="flex items-center justify-center h-full px-6">
            <div className="text-center max-w-sm">
              <div className="relative inline-flex items-center justify-center w-24 h-24 mb-6">
                <div className="absolute inset-0 bg-violet-600/30 rounded-2xl animate-ping" style={{ animationDuration: '2s' }} />
                <div className="relative w-20 h-20 rounded-2xl bg-gradient-to-br from-violet-600 to-purple-700 border border-violet-500/30 flex items-center justify-center shadow-xl shadow-violet-500/20">
                  <Eye className="w-10 h-10 text-white" />
                </div>
              </div>
              <h2 className="text-xl font-semibold mb-2">Waiting for Bubbi...</h2>
              <p className="text-slate-500 mb-6">
                Listening for live events. When Bubbi starts working on a task, you&apos;ll see the thought process unfold here in real-time.
              </p>
              <div className="flex items-center justify-center gap-1.5">
                <span className="w-1.5 h-1.5 bg-violet-500 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                <span className="w-1.5 h-1.5 bg-violet-500 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                <span className="w-1.5 h-1.5 bg-violet-500 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
              </div>
            </div>
          </div>
        )}
        
        {mode === 'watch' && session && (
          <ReactFlowProvider>
            <SynapseGraph />
          </ReactFlowProvider>
        )}
        
        {mode === 'demo' && (
          <div className="absolute top-4 left-4 z-10">
            <SessionSelector
              sessions={demoSessions}
              currentSession={session}
              onSelect={handleSessionChange}
            />
          </div>
        )}
        
        {mode === 'live' && session && (
          <div className="absolute top-4 left-4 z-10">
            <div className="flex items-center gap-3 bg-slate-900/90 backdrop-blur-xl border border-slate-700/50 rounded-xl px-4 py-3">
              <div className="relative">
                <div className="p-2 bg-green-500/20 rounded-lg border border-green-500/20">
                  <Zap className="w-4 h-4 text-green-400" />
                </div>
                <span className="absolute -top-1 -right-1 w-3 h-3 bg-green-500 rounded-full animate-pulse" />
              </div>
              <div>
                <div className="text-sm font-medium text-white">{session.name}</div>
                <div className="text-[11px] text-slate-500">{session.events.length} events · Live</div>
              </div>
            </div>
          </div>
        )}
        
        {mode === 'watch' && session && (
          <div className="absolute top-4 left-4 z-10">
            <div className="flex items-center gap-3 bg-slate-900/90 backdrop-blur-xl border border-violet-500/30 rounded-xl px-4 py-3">
              <div className="relative">
                <div className="p-2 bg-violet-500/20 rounded-lg border border-violet-500/20">
                  <Eye className="w-4 h-4 text-violet-400" />
                </div>
                <span className="absolute -top-1 -right-1 w-3 h-3 bg-violet-500 rounded-full animate-pulse" />
              </div>
              <div>
                <div className="text-sm font-medium text-white">{session.name}</div>
                <div className="text-[11px] text-slate-500">{session.events.length} events · Watching Bubbi</div>
              </div>
            </div>
          </div>
        )}
        
        {/* Event detail - full screen overlay on mobile, side panel on desktop */}
        <EventDetail 
          event={selectedEvent} 
          onClose={() => setSelectedEventId(null)} 
        />
        
        {session && playback.currentEventIndex < 0 && mode !== 'live' && mode !== 'watch' && (
          <div className="absolute bottom-24 left-1/2 -translate-x-1/2 flex items-center gap-2 px-4 py-2 bg-slate-800/80 backdrop-blur rounded-full border border-slate-700/50 text-sm text-slate-400">
            <Sparkles className="w-4 h-4 text-indigo-400" />
            Press play or spacebar to start
          </div>
        )}
      </main>
      
      {session && mode !== 'live' && mode !== 'watch' && <PlaybackControls />}
      
      {session && mode === 'live' && (
        <div className="bg-slate-900/95 backdrop-blur-xl border-t border-slate-800 px-4 py-3">
          <div className="max-w-4xl mx-auto flex items-center justify-between">
            <div className="flex items-center gap-2 text-sm">
              <span className="font-mono text-slate-300">{session.events.length}</span>
              <span className="text-slate-600">events received</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
              <span className="text-sm text-green-400">Streaming</span>
            </div>
          </div>
        </div>
      )}
      
      {session && mode === 'watch' && (
        <div className="bg-slate-900/95 backdrop-blur-xl border-t border-violet-900/50 px-4 py-3">
          <div className="max-w-4xl mx-auto flex items-center justify-between">
            <div className="flex items-center gap-2 text-sm">
              <span className="font-mono text-slate-300">{session.events.length}</span>
              <span className="text-slate-600">events from Bubbi</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 bg-violet-500 rounded-full animate-pulse" />
              <span className="text-sm text-violet-400">Watching Live</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
