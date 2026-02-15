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

// Playback speeds - base interval is 600ms at 1x
const SPEEDS = [0.25, 0.5, 1, 2];
const BASE_INTERVAL = 600; // ms per event at 1x speed

export function PlaybackControls() {
  const { 
    session, 
    playback, 
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
      const interval = BASE_INTERVAL / playback.speed;
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
    <div className="bg-slate-900/95 backdrop-blur-xl border-t border-slate-800 px-3 sm:px-4 py-2 sm:py-3">
      <div className="max-w-4xl mx-auto">
        {/* Progress bar */}
        {/* Outer touch target (44px min) wrapping the thin visual bar */}
        <div 
          className="relative h-1.5 bg-slate-800 rounded-full mb-3 cursor-pointer group before:absolute before:-top-5 before:-bottom-5 before:left-0 before:right-0 before:content-['']"
          onClick={(e) => {
            const rect = e.currentTarget.getBoundingClientRect();
            const percent = (e.clientX - rect.left) / rect.width;
            const targetIndex = Math.floor(percent * totalEvents) - 1;
            seekTo(targetIndex);
          }}
        >
          <motion.div
            className="absolute top-0 left-0 h-full bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 rounded-full"
            initial={{ width: 0 }}
            animate={{ width: `${progress}%` }}
            transition={{ duration: 0.15, ease: 'easeOut' }}
          />
          {/* Glow effect */}
          <motion.div
            className="absolute top-0 left-0 h-full bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 rounded-full blur-sm opacity-50"
            animate={{ width: `${progress}%` }}
            transition={{ duration: 0.15, ease: 'easeOut' }}
          />
          {/* Hover indicator */}
          <div className="absolute inset-0 bg-white/5 rounded-full opacity-0 group-hover:opacity-100 transition-opacity" />
        </div>
        
        {/* Controls */}
        <div className="flex items-center justify-between">
          {/* Left: Event counter */}
          <div className="flex items-center gap-2 text-sm min-w-[100px]">
            <span className="font-mono text-slate-300">
              {currentEvent > 0 ? currentEvent : '—'}
            </span>
            <span className="text-slate-500">/</span>
            <span className="font-mono text-slate-500">{totalEvents}</span>
          </div>
          
          {/* Center: Playback buttons */}
          <div className="flex items-center gap-1">
            <button
              onClick={reset}
              className="p-2 rounded-lg text-slate-500 hover:text-white hover:bg-slate-800 transition-all duration-150"
              title="Reset (R)"
            >
              <RotateCcw className="w-4 h-4" />
            </button>
            
            <button
              onClick={stepBackward}
              className="p-2 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-all duration-150"
              title="Step back (←)"
            >
              <SkipBack className="w-5 h-5" />
            </button>
            
            <motion.button
              onClick={togglePlayback}
              whileTap={{ scale: 0.95 }}
              className={`
                p-3.5 rounded-full transition-all duration-200
                ${playback.isPlaying 
                  ? 'bg-slate-700 hover:bg-slate-600 text-white' 
                  : 'bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white shadow-lg shadow-indigo-500/25'
                }
              `}
              title="Play/Pause (Space)"
            >
              {playback.isPlaying ? (
                <Pause className="w-5 h-5" />
              ) : (
                <Play className="w-5 h-5 ml-0.5" />
              )}
            </motion.button>
            
            <button
              onClick={stepForward}
              className="p-2 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-all duration-150"
              title="Step forward (→)"
            >
              <SkipForward className="w-5 h-5" />
            </button>
          </div>
          
          {/* Right: Speed control */}
          <div className="flex items-center gap-2 min-w-[60px] sm:min-w-[100px] justify-end">
            <Gauge className="w-3.5 h-3.5 text-slate-500 hidden sm:block" />
            <div className="flex bg-slate-800/80 rounded-lg p-0.5">
              {SPEEDS.map((speed) => (
                <button
                  key={speed}
                  onClick={() => setSpeed(speed)}
                  className={`
                    px-2 py-1 text-xs font-medium rounded transition-all duration-150
                    ${playback.speed === speed 
                      ? 'bg-indigo-600 text-white shadow-sm' 
                      : 'text-slate-500 hover:text-white'
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
