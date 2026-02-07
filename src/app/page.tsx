'use client';

import { useEffect, useMemo } from 'react';
import { ReactFlowProvider } from 'reactflow';
import { Brain, Upload, Radio, Github, Sparkles } from 'lucide-react';
import { SynapseGraph } from '@/components/graph/SynapseGraph';
import { PlaybackControls } from '@/components/controls/PlaybackControls';
import { SessionSelector } from '@/components/ui/SessionSelector';
import { EventDetail } from '@/components/ui/EventDetail';
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
    <div className="flex flex-col h-screen bg-slate-950 text-white">
      {/* Header */}
      <header className="flex items-center justify-between px-6 py-4 border-b border-slate-800 bg-slate-900/80 backdrop-blur">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-xl">
            <Brain className="w-6 h-6 text-white" />
          </div>
          <div>
            <h1 className="text-xl font-bold tracking-tight">SYNAPSE</h1>
            <p className="text-xs text-slate-400">Watch AI Agents Think</p>
          </div>
        </div>
        
        {/* Mode tabs */}
        <div className="flex items-center bg-slate-800/50 rounded-lg p-1">
          <button
            onClick={() => handleModeChange('demo')}
            className={`flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-colors ${
              mode === 'demo' 
                ? 'bg-indigo-600 text-white' 
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <Sparkles className="w-4 h-4" />
            Demo
          </button>
          <button
            onClick={() => handleModeChange('upload')}
            className={`flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-colors ${
              mode === 'upload' 
                ? 'bg-indigo-600 text-white' 
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <Upload className="w-4 h-4" />
            Upload
          </button>
          <button
            onClick={() => handleModeChange('live')}
            className={`flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-colors ${
              mode === 'live' 
                ? 'bg-indigo-600 text-white' 
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <Radio className="w-4 h-4" />
            Live
          </button>
        </div>
        
        {/* GitHub link */}
        <a
          href="https://github.com/AndriGitDev/synapse"
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-2 px-3 py-2 text-slate-400 hover:text-white transition-colors"
        >
          <Github className="w-5 h-5" />
          <span className="text-sm hidden sm:inline">GitHub</span>
        </a>
      </header>
      
      {/* Main content */}
      <main className="flex-1 overflow-hidden relative">
        {mode === 'demo' && (
          <ReactFlowProvider>
            <SynapseGraph />
          </ReactFlowProvider>
        )}
        
        {mode === 'upload' && (
          <div className="flex items-center justify-center h-full">
            <div className="text-center max-w-md p-8">
              <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-slate-800 flex items-center justify-center">
                <Upload className="w-8 h-8 text-slate-400" />
              </div>
              <h2 className="text-xl font-semibold mb-2">Upload Agent Logs</h2>
              <p className="text-slate-400 mb-6">
                Drag and drop your agent session logs to visualize them.
                Supports Clawdbot, LangChain, and generic JSONL formats.
              </p>
              <div className="border-2 border-dashed border-slate-700 rounded-xl p-8 hover:border-indigo-500 transition-colors cursor-pointer">
                <p className="text-slate-500">Drop files here or click to browse</p>
              </div>
            </div>
          </div>
        )}
        
        {mode === 'live' && (
          <div className="flex items-center justify-center h-full">
            <div className="text-center max-w-md p-8">
              <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-slate-800 flex items-center justify-center">
                <Radio className="w-8 h-8 text-slate-400" />
              </div>
              <h2 className="text-xl font-semibold mb-2">Live Connection</h2>
              <p className="text-slate-400 mb-6">
                Connect to a running AI agent to watch its thinking in real-time.
              </p>
              <div className="bg-slate-800 rounded-lg p-4 mb-4">
                <label className="block text-sm text-slate-400 mb-2 text-left">
                  WebSocket URL
                </label>
                <input
                  type="text"
                  placeholder="ws://localhost:8080/synapse"
                  className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500"
                />
              </div>
              <button className="px-6 py-2 bg-indigo-600 hover:bg-indigo-500 rounded-lg font-medium transition-colors">
                Connect
              </button>
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
      </main>
      
      {/* Playback controls */}
      {session && <PlaybackControls />}
      
      {/* Built by AI badge */}
      <div className="absolute bottom-20 right-4 text-xs text-slate-600 flex items-center gap-1">
        <span>Built by an AI</span>
        <span>🤖</span>
      </div>
    </div>
  );
}
