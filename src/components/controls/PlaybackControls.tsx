'use client';

import { useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import { 
  Play, 
  Pause, 
  SkipBack, 
  SkipForward, 
  RotateCcw,
  Gauge
} from 'lucide-react';
import { useSynapseStore } from '@/lib/store';

const SPEEDS = [0.5, 1, 2, 4];

export function PlaybackControls() {
  const { 
    session, 
    playback, 
    play, 
    pause, 
    togglePlayback,
    stepForward, 
    stepBackward, 
    reset,
    seekTo,
    setSpeed,
    tick
  } = useSynapseStore();
  
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  
  // Handle playback timer
  useEffect(() => {
    if (playback.isPlaying) {
      const interval = 1000 / playback.speed;
      intervalRef.current = setInterval(tick, interval);
    } else {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    }
    
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [playback.isPlaying, playback.speed, tick]);
  
  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement) return;
      
      switch (e.key) {
        case ' ':
          e.preventDefault();
          togglePlayback();
          break;
        case 'ArrowLeft':
          stepBackward();
          break;
        case 'ArrowRight':
          stepForward();
          break;
        case 'r':
          reset();
          break;
      }
    };
    
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [togglePlayback, stepForward, stepBackward, reset]);
  
  if (!session) return null;
  
  const totalEvents = session.events.length;
  const currentEvent = playback.currentEventIndex + 1;
  const progress = totalEvents > 0 ? (currentEvent / totalEvents) * 100 : 0;
  
  return (
    <div className="bg-slate-900/95 backdrop-blur border-t border-slate-800 px-4 py-3">
      <div className="max-w-4xl mx-auto">
        {/* Progress bar */}
        <div 
          className="relative h-2 bg-slate-800 rounded-full mb-3 cursor-pointer group"
          onClick={(e) => {
            const rect = e.currentTarget.getBoundingClientRect();
            const percent = (e.clientX - rect.left) / rect.width;
            const targetIndex = Math.floor(percent * totalEvents) - 1;
            seekTo(targetIndex);
          }}
        >
          <motion.div
            className="absolute top-0 left-0 h-full bg-gradient-to-r from-indigo-500 to-purple-500 rounded-full"
            initial={{ width: 0 }}
            animate={{ width: `${progress}%` }}
            transition={{ duration: 0.2 }}
          />
          <div 
            className="absolute top-0 h-full w-full opacity-0 group-hover:opacity-100 transition-opacity"
            style={{
              background: 'linear-gradient(to right, transparent, rgba(99, 102, 241, 0.2))'
            }}
          />
        </div>
        
        {/* Controls */}
        <div className="flex items-center justify-between">
          {/* Left: Event counter */}
          <div className="flex items-center gap-2 text-sm text-slate-400 min-w-[120px]">
            <span className="font-mono">
              {currentEvent > 0 ? currentEvent : '-'} / {totalEvents}
            </span>
            <span className="text-slate-600">events</span>
          </div>
          
          {/* Center: Playback buttons */}
          <div className="flex items-center gap-1">
            <button
              onClick={reset}
              className="p-2 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
              title="Reset (R)"
            >
              <RotateCcw className="w-5 h-5" />
            </button>
            
            <button
              onClick={stepBackward}
              className="p-2 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
              title="Step back (←)"
            >
              <SkipBack className="w-5 h-5" />
            </button>
            
            <button
              onClick={togglePlayback}
              className="p-3 rounded-full bg-indigo-600 hover:bg-indigo-500 text-white transition-colors"
              title="Play/Pause (Space)"
            >
              {playback.isPlaying ? (
                <Pause className="w-6 h-6" />
              ) : (
                <Play className="w-6 h-6 ml-0.5" />
              )}
            </button>
            
            <button
              onClick={stepForward}
              className="p-2 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
              title="Step forward (→)"
            >
              <SkipForward className="w-5 h-5" />
            </button>
          </div>
          
          {/* Right: Speed control */}
          <div className="flex items-center gap-2 min-w-[120px] justify-end">
            <Gauge className="w-4 h-4 text-slate-500" />
            <div className="flex bg-slate-800 rounded-lg p-0.5">
              {SPEEDS.map((speed) => (
                <button
                  key={speed}
                  onClick={() => setSpeed(speed)}
                  className={`
                    px-2 py-1 text-xs font-medium rounded-md transition-colors
                    ${playback.speed === speed 
                      ? 'bg-indigo-600 text-white' 
                      : 'text-slate-400 hover:text-white'
                    }
                  `}
                >
                  {speed}x
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
