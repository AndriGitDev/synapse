'use client';

import { useEffect, useMemo } from 'react';
import { ReactFlowProvider } from 'reactflow';
import { Brain, Upload, Github, Sparkles, Zap } from 'lucide-react';
import { SynapseGraph } from '@/components/graph/SynapseGraph';
import { PlaybackControls } from '@/components/controls/PlaybackControls';
import { SessionSelector } from '@/components/ui/SessionSelector';
import { EventDetail } from '@/components/ui/EventDetail';
import { FileUpload } from '@/components/ui/FileUpload';
import { useSynapseStore } from '@/lib/store';
import { demoSessions } from '@/data/demo-sessions/building-website';

export default function Home() {
  const { 
    mode, 
    setMode, 
    session, 
    setSession, 
    reset, 
    selectedEventId, 
    setSelectedEventId,
    playback 
  } = useSynapseStore();
  
  // Load demo session on mount
  useEffect(() => {
    if (mode === 'demo' && !session) {
      setSession(demoSessions[0]);
    }
  }, [mode, session, setSession]);
  
  // Handle mode change
  const handleModeChange = (newMode: 'demo' | 'upload' | 'live') => {
    setMode(newMode);
    reset();
    setSelectedEventId(null);
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
              <FileUpload 
                onSessionLoaded={(s) => {
                  setSession(s);
                }} 
              />
            </div>
          </div>
        )}
        
        {mode === 'upload' && session && (
          <ReactFlowProvider>
            <SynapseGraph />
          </ReactFlowProvider>
        )}
        
        {mode === 'live' && (
          <div className="flex items-center justify-center h-full">
            <div className="text-center max-w-md p-8">
              <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-br from-slate-800 to-slate-900 border border-slate-700 mb-6 relative">
                <Zap className="w-7 h-7 text-slate-400" />
                <span className="absolute -top-1 -right-1 w-3 h-3 bg-amber-500 rounded-full animate-pulse" />
              </div>
              <h2 className="text-xl font-semibold mb-2">Live Connection</h2>
              <p className="text-slate-500 mb-6">
                Connect to a running AI agent to watch its thinking in real-time.
              </p>
              <div className="bg-slate-800/50 rounded-xl p-4 mb-4 border border-slate-700/50">
                <label className="block text-sm text-slate-400 mb-2 text-left">
                  WebSocket URL
                </label>
                <input
                  type="text"
                  placeholder="ws://localhost:8080/synapse"
                  className="w-full px-3 py-2.5 bg-slate-900/80 border border-slate-700 rounded-lg text-white placeholder-slate-600 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500/50 transition-all"
                />
              </div>
              <button className="w-full px-6 py-2.5 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 rounded-lg font-medium transition-all shadow-lg shadow-indigo-500/20">
                Connect
              </button>
              <p className="text-xs text-slate-600 mt-4">
                Coming soon: Clawdbot integration
              </p>
            </div>
          </div>
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
        
        {/* Event detail panel */}
        <EventDetail 
          event={selectedEvent} 
          onClose={() => setSelectedEventId(null)} 
        />
        
        {/* Instructions hint */}
        {session && playback.currentEventIndex < 0 && (
          <div className="absolute bottom-24 left-1/2 -translate-x-1/2 flex items-center gap-2 px-4 py-2 bg-slate-800/80 backdrop-blur rounded-full border border-slate-700/50 text-sm text-slate-400">
            <Sparkles className="w-4 h-4 text-indigo-400" />
            Press play or spacebar to start
          </div>
        )}
      </main>
      
      {/* Playback controls */}
      {session && <PlaybackControls />}
      
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
