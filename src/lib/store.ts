import { create } from 'zustand';
import { AgentSession, AgentEvent, PlaybackState } from './types';

interface SynapseStore {
  // Session state
  session: AgentSession | null;
  setSession: (session: AgentSession | null) => void;
  
  // Live mode: add event dynamically
  addLiveEvent: (event: AgentEvent) => void;
  
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
  
  // Live mode state
  isLiveMode: boolean;
  setLiveMode: (isLive: boolean) => void;
}

const initialPlaybackState: PlaybackState = {
  isPlaying: false,
  currentEventIndex: -1,
  speed: 2, // Default to 2x for snappier feel
  visibleEvents: [],
};

export const useSynapseStore = create<SynapseStore>((set, get) => ({
  // Session
  session: null,
  setSession: (session) => set({ 
    session,
    playback: { ...initialPlaybackState },
  }),
  
  // Live mode: add event and auto-advance
  addLiveEvent: (event) => {
    const { session, isLiveMode } = get();
    if (!session) return;
    
    const updatedSession = {
      ...session,
      events: [...session.events, event],
    };
    
    // In live mode, auto-advance to show the new event
    if (isLiveMode) {
      set({
        session: updatedSession,
        playback: {
          ...get().playback,
          currentEventIndex: updatedSession.events.length - 1,
          visibleEvents: updatedSession.events,
        }
      });
    } else {
      set({ session: updatedSession });
    }
  },
  
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
  
  // Live mode
  isLiveMode: false,
  setLiveMode: (isLive) => set({ isLiveMode: isLive }),
}));
