import { create } from 'zustand';
import { AgentSession, AgentEvent, PlaybackState } from './types';

interface SynapseStore {
  // Session state
  session: AgentSession | null;
  setSession: (session: AgentSession | null) => void;
  
  // Playback state
  playback: PlaybackState;
  play: () => void;
  pause: () => void;
  togglePlayback: () => void;
  setSpeed: (speed: number) => void;
  stepForward: () => void;
  stepBackward: () => void;
  seekTo: (index: number) => void;
  reset: () => void;
  
  // Advance playback (called by timer)
  tick: () => void;
  
  // UI state
  selectedEventId: string | null;
  setSelectedEventId: (id: string | null) => void;
  
  // Mode
  mode: 'demo' | 'upload' | 'live';
  setMode: (mode: 'demo' | 'upload' | 'live') => void;
}

const initialPlaybackState: PlaybackState = {
  isPlaying: false,
  currentEventIndex: -1,
  speed: 1,
  visibleEvents: [],
};

export const useSynapseStore = create<SynapseStore>((set, get) => ({
  // Session
  session: null,
  setSession: (session) => set({ 
    session,
    playback: { ...initialPlaybackState },
  }),
  
  // Playback
  playback: initialPlaybackState,
  
  play: () => set((state) => ({
    playback: { ...state.playback, isPlaying: true }
  })),
  
  pause: () => set((state) => ({
    playback: { ...state.playback, isPlaying: false }
  })),
  
  togglePlayback: () => set((state) => ({
    playback: { ...state.playback, isPlaying: !state.playback.isPlaying }
  })),
  
  setSpeed: (speed) => set((state) => ({
    playback: { ...state.playback, speed }
  })),
  
  stepForward: () => {
    const { session, playback } = get();
    if (!session) return;
    
    const nextIndex = Math.min(
      playback.currentEventIndex + 1,
      session.events.length - 1
    );
    
    set({
      playback: {
        ...playback,
        currentEventIndex: nextIndex,
        visibleEvents: session.events.slice(0, nextIndex + 1),
      }
    });
  },
  
  stepBackward: () => {
    const { session, playback } = get();
    if (!session) return;
    
    const prevIndex = Math.max(playback.currentEventIndex - 1, -1);
    
    set({
      playback: {
        ...playback,
        currentEventIndex: prevIndex,
        visibleEvents: prevIndex >= 0 ? session.events.slice(0, prevIndex + 1) : [],
      }
    });
  },
  
  seekTo: (index) => {
    const { session, playback } = get();
    if (!session) return;
    
    const clampedIndex = Math.max(-1, Math.min(index, session.events.length - 1));
    
    set({
      playback: {
        ...playback,
        currentEventIndex: clampedIndex,
        visibleEvents: clampedIndex >= 0 ? session.events.slice(0, clampedIndex + 1) : [],
      }
    });
  },
  
  reset: () => {
    set({
      playback: { ...initialPlaybackState }
    });
  },
  
  tick: () => {
    const { session, playback } = get();
    if (!session || !playback.isPlaying) return;
    
    if (playback.currentEventIndex >= session.events.length - 1) {
      // Reached the end, stop playing
      set({
        playback: { ...playback, isPlaying: false }
      });
      return;
    }
    
    get().stepForward();
  },
  
  // UI
  selectedEventId: null,
  setSelectedEventId: (id) => set({ selectedEventId: id }),
  
  // Mode
  mode: 'demo',
  setMode: (mode) => set({ mode }),
}));
