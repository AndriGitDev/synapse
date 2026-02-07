// Core types for SYNAPSE

export type EventType = 
  | 'thought' 
  | 'tool_call' 
  | 'tool_result' 
  | 'file_read' 
  | 'file_write' 
  | 'decision' 
  | 'error'
  | 'user_message'
  | 'assistant_message';

export interface AgentEvent {
  id: string;
  timestamp: Date;
  type: EventType;
  content: string;
  metadata?: {
    tool?: string;
    file?: string;
    duration?: number;
    success?: boolean;
    [key: string]: unknown;
  };
  parentId?: string;
}

export interface AgentSession {
  id: string;
  name: string;
  description?: string;
  agent: 'clawdbot' | 'langchain' | 'crewai' | 'claude' | 'generic';
  startedAt: Date;
  endedAt?: Date;
  events: AgentEvent[];
}

export interface PlaybackState {
  isPlaying: boolean;
  currentEventIndex: number;
  speed: number; // 0.5, 1, 2, 4
  visibleEvents: AgentEvent[];
}

// Node types for React Flow
export interface SynapseNodeData {
  event: AgentEvent;
  isActive: boolean;
  isVisible: boolean;
}

// Color scheme for different event types
export const EVENT_COLORS: Record<EventType, { bg: string; border: string; text: string }> = {
  thought: { bg: 'bg-purple-500/20', border: 'border-purple-500', text: 'text-purple-300' },
  tool_call: { bg: 'bg-blue-500/20', border: 'border-blue-500', text: 'text-blue-300' },
  tool_result: { bg: 'bg-green-500/20', border: 'border-green-500', text: 'text-green-300' },
  file_read: { bg: 'bg-cyan-500/20', border: 'border-cyan-500', text: 'text-cyan-300' },
  file_write: { bg: 'bg-orange-500/20', border: 'border-orange-500', text: 'text-orange-300' },
  decision: { bg: 'bg-yellow-500/20', border: 'border-yellow-500', text: 'text-yellow-300' },
  error: { bg: 'bg-red-500/20', border: 'border-red-500', text: 'text-red-300' },
  user_message: { bg: 'bg-slate-500/20', border: 'border-slate-500', text: 'text-slate-300' },
  assistant_message: { bg: 'bg-indigo-500/20', border: 'border-indigo-500', text: 'text-indigo-300' },
};

// Icons for different event types (Lucide icon names)
export const EVENT_ICONS: Record<EventType, string> = {
  thought: 'Brain',
  tool_call: 'Wrench',
  tool_result: 'CheckCircle',
  file_read: 'FileText',
  file_write: 'FilePlus',
  decision: 'GitBranch',
  error: 'AlertCircle',
  user_message: 'User',
  assistant_message: 'Bot',
};
