'use client';

import { useEffect, useMemo, useCallback } from 'react';
import { ReactFlowProvider } from 'reactflow';
import { Brain, Upload, Github, Sparkles, Zap, Eye } from 'lucide-react';
import { SynapseGraph } from '@/components/graph/SynapseGraph';
import { PlaybackControls } from '@/components/controls/PlaybackControls';
import { SessionSelector } from '@/components/ui/SessionSelector';
import { EventDetail } from '@/components/ui/EventDetail';
import { FileUpload } from '@/components/ui/FileUpload';
import { LiveConnection } from '@/components/live/LiveConnection';
import { WatchDataLive } from '@/components/live/WatchDataLive';
import { useSynapseStore } from '@/lib/store';
import { demoSessions } from '@/data/demo-sessions/building-website';
import { AgentSession, AgentEvent } from '@/lib/types';

export default function Home() {
  const { 
    mode, 
    setMode, 
    session, 
    setSession, 
    reset, 
    selectedEventId, 
    setSelectedEventId,
    playback,
    addLiveEvent,
    setLiveMode,
  } = useSynapseStore();
  
  // Load demo session on mount
  useEffect(() => {
    if (mode === 'demo' && !session) {
      setSession(demoSessions[0]);
    }
  }, [mode, session, setSession]);
  
  // Handle mode change
  const handleModeChange = (newMode: 'demo' | 'upload' | 'live' | 'watch') => {
    setMode(newMode);
    reset();
    setSelectedEventId(null);
    setLiveMode(newMode === 'live' || newMode === 'watch');
    if (newMode === 'demo') {
      setSession(demoSessions[0]);
    } else {
      setSession(null);
    }
  };
  
  // Handle session change
  const handleSessionChange = (newSession: typeof demoSessions[0]) => {
    reset();
    setSelectedEventId(null);
    setSession(newSession);
  };
  
  // Get selected event
  const selectedEvent = useMemo(() => {
    if (!session || !selectedEventId) return null;
    return session.events.find(e => e.id === selectedEventId) || null;
  }, [session, selectedEventId]);
  
  // Live mode handlers
  const handleLiveSessionStart = useCallback((sessionInfo: { id: string; name: string; agent: string }) => {
    const newSession: AgentSession = {
      id: sessionInfo.id,
      name: sessionInfo.name || 'Live Session',
      description: 'Real-time agent session',
      agent: sessionInfo.agent as AgentSession['agent'],
      startedAt: new Date(),
      events: [],
    };
    setSession(newSession);
    setLiveMode(true);
  }, [setSession, setLiveMode]);
  
  const handleLiveEvent = useCallback((event: AgentEvent) => {
    addLiveEvent(event);
  }, [addLiveEvent]);
  
  return (
    <div className="flex flex-col h-screen bg-slate-950 text-white overflow-hidden">
      {/* Header */}
      <header className="flex items-center justify-between px-5 py-3 border-b border-slate-800/80 bg-slate-900/60 backdrop-blur-xl z-20">
        <div className="flex items-center gap-3">
          <div className="relative">
            <div className="absolute inset-0 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-xl blur-md opacity-50" />
            <div className="relative p-2 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-xl">
              <Brain className="w-5 h-5 text-white" />
            </div>
          </div>
          <div>
            <h1 className="text-lg font-bold tracking-tight flex items-center gap-2">
              SYNAPSE
              <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-indigo-500/20 text-indigo-300 font-medium">
                BETA
              </span>
            </h1>
            <p className="text-[11px] text-slate-500">Watch AI Agents Think</p>
          </div>
        </div>
        
        {/* Mode tabs */}
        <div className="flex items-center bg-slate-800/40 rounded-lg p-1 border border-slate-700/50">
          <button
            onClick={() => handleModeChange('demo')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm font-medium transition-all duration-200 ${
              mode === 'demo' 
                ? 'bg-gradient-to-r from-indigo-600 to-purple-600 text-white shadow-lg shadow-indigo-500/20' 
                : 'text-slate-400 hover:text-white hover:bg-slate-700/50'
            }`}
          >
            <Sparkles className="w-3.5 h-3.5" />
            Demo
          </button>
          <button
            onClick={() => handleModeChange('upload')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm font-medium transition-all duration-200 ${
              mode === 'upload' 
                ? 'bg-gradient-to-r from-indigo-600 to-purple-600 text-white shadow-lg shadow-indigo-500/20' 
                : 'text-slate-400 hover:text-white hover:bg-slate-700/50'
            }`}
          >
            <Upload className="w-3.5 h-3.5" />
            Upload
          </button>
          <button
            onClick={() => handleModeChange('live')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm font-medium transition-all duration-200 ${
              mode === 'live' 
                ? 'bg-gradient-to-r from-indigo-600 to-purple-600 text-white shadow-lg shadow-indigo-500/20' 
                : 'text-slate-400 hover:text-white hover:bg-slate-700/50'
            }`}
          >
            <Zap className="w-3.5 h-3.5" />
            Live
          </button>
          <button
            onClick={() => handleModeChange('watch')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm font-medium transition-all duration-200 ${
              mode === 'watch' 
                ? 'bg-gradient-to-r from-violet-600 to-purple-600 text-white shadow-lg shadow-violet-500/20' 
                : 'text-slate-400 hover:text-white hover:bg-slate-700/50'
            }`}
          >
            <Eye className="w-3.5 h-3.5" />
            Watch Data
          </button>
        </div>
        
        {/* GitHub link */}
        <a
          href="https://github.com/AndriGitDev/synapse"
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-2 px-3 py-1.5 text-slate-500 hover:text-white transition-colors rounded-lg hover:bg-slate-800/50"
        >
          <Github className="w-4 h-4" />
          <span className="text-sm hidden sm:inline">Source</span>
        </a>
      </header>
      
      {/* Main content */}
      <main className="flex-1 overflow-hidden relative">
        {/* Demo mode */}
        {mode === 'demo' && (
          <ReactFlowProvider>
            <SynapseGraph />
          </ReactFlowProvider>
        )}
        
        {/* Upload mode - no session yet */}
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
              <FileUpload 
                onSessionLoaded={(s) => {
                  setSession(s);
                }} 
              />
            </div>
          </div>
        )}
        
        {/* Upload mode - session loaded */}
        {mode === 'upload' && session && (
          <ReactFlowProvider>
            <SynapseGraph />
          </ReactFlowProvider>
        )}
        
        {/* Live mode - not connected */}
        {mode === 'live' && !session && (
          <LiveConnection
            onSessionStart={handleLiveSessionStart}
            onEventReceived={handleLiveEvent}
          />
        )}
        
        {/* Live mode - connected and receiving */}
        {mode === 'live' && session && (
          <ReactFlowProvider>
            <SynapseGraph />
          </ReactFlowProvider>
        )}
        
        {/* Watch Data mode - not connected */}
        {mode === 'watch' && !session && (
          <WatchDataLive
            onSessionStart={handleLiveSessionStart}
            onEventReceived={handleLiveEvent}
          />
        )}
        
        {/* Watch Data mode - connected and receiving */}
        {mode === 'watch' && session && (
          <ReactFlowProvider>
            <SynapseGraph />
          </ReactFlowProvider>
        )}
        
        {/* Session selector (demo mode) */}
        {mode === 'demo' && (
          <div className="absolute top-4 left-4 z-10">
            <SessionSelector
              sessions={demoSessions}
              currentSession={session}
              onSelect={handleSessionChange}
            />
          </div>
        )}
        
        {/* Live mode session info */}
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
                <div className="text-[11px] text-slate-500">
                  {session.events.length} events · Live
                </div>
              </div>
            </div>
          </div>
        )}
        
        {/* Watch Data mode session info */}
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
                <div className="text-[11px] text-slate-500">
                  {session.events.length} events · Watching Data
                </div>
              </div>
            </div>
          </div>
        )}
        
        {/* Event detail panel */}
        <EventDetail 
          event={selectedEvent} 
          onClose={() => setSelectedEventId(null)} 
        />
        
        {/* Instructions hint */}
        {session && playback.currentEventIndex < 0 && mode !== 'live' && (
          <div className="absolute bottom-24 left-1/2 -translate-x-1/2 flex items-center gap-2 px-4 py-2 bg-slate-800/80 backdrop-blur rounded-full border border-slate-700/50 text-sm text-slate-400">
            <Sparkles className="w-4 h-4 text-indigo-400" />
            Press play or spacebar to start
          </div>
        )}
      </main>
      
      {/* Playback controls - not shown in live/watch mode while receiving */}
      {session && mode !== 'live' && mode !== 'watch' && <PlaybackControls />}
      
      {/* Live mode mini controls */}
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
      
      {/* Watch Data mode mini controls */}
      {session && mode === 'watch' && (
        <div className="bg-slate-900/95 backdrop-blur-xl border-t border-violet-900/50 px-4 py-3">
          <div className="max-w-4xl mx-auto flex items-center justify-between">
            <div className="flex items-center gap-2 text-sm">
              <span className="font-mono text-slate-300">{session.events.length}</span>
              <span className="text-slate-600">events from Data</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 bg-violet-500 rounded-full animate-pulse" />
              <span className="text-sm text-violet-400">Watching Live</span>
            </div>
          </div>
        </div>
      )}
      
      {/* Built by AI badge */}
      <a
        href="https://andri.is"
        target="_blank"
        rel="noopener noreferrer" 
        className="absolute bottom-20 right-4 text-[10px] text-slate-700 hover:text-slate-500 transition-colors"
      >
        Built by an AI 🤖
      </a>
    </div>
  );
}
