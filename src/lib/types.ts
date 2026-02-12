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
  | 'assistant_message'
  | 'spawn_agent'
  | 'agent_complete'
  | 'agent_handoff';

export interface AgentInfo {
  id: string;
  name: string;
  role?: string;
  color?: string;
  parentAgentId?: string;
}

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
    // Sub-agent specific
    spawnedAgent?: AgentInfo;
    agentResult?: string;
    handoffTo?: string;
    [key: string]: unknown;
  };
  parentId?: string;
  // Which agent produced this event (for multi-agent sessions)
  agentId?: string;
}

export interface AgentSession {
  id: string;
  name: string;
  description?: string;
  agent: 'clawdbot' | 'langchain' | 'crewai' | 'claude' | 'generic';
  startedAt: Date;
  endedAt?: Date;
  events: AgentEvent[];
  // Multi-agent support
  agents?: AgentInfo[];
  isMultiAgent?: boolean;
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
  agent?: AgentInfo;
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
  spawn_agent: { bg: 'bg-pink-500/20', border: 'border-pink-500', text: 'text-pink-300' },
  agent_complete: { bg: 'bg-emerald-500/20', border: 'border-emerald-500', text: 'text-emerald-300' },
  agent_handoff: { bg: 'bg-amber-500/20', border: 'border-amber-500', text: 'text-amber-300' },
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
  spawn_agent: 'Sparkles',
  agent_complete: 'CheckCircle2',
  agent_handoff: 'ArrowRightLeft',
};

// Agent colors for multi-agent visualization
export const AGENT_COLORS: Record<string, { bg: string; border: string; text: string; glow: string }> = {
  orchestrator: { bg: 'bg-violet-900/30', border: 'border-violet-500', text: 'text-violet-300', glow: 'rgba(139, 92, 246, 0.3)' },
  researcher: { bg: 'bg-blue-900/30', border: 'border-blue-500', text: 'text-blue-300', glow: 'rgba(59, 130, 246, 0.3)' },
  writer: { bg: 'bg-emerald-900/30', border: 'border-emerald-500', text: 'text-emerald-300', glow: 'rgba(16, 185, 129, 0.3)' },
  reviewer: { bg: 'bg-amber-900/30', border: 'border-amber-500', text: 'text-amber-300', glow: 'rgba(245, 158, 11, 0.3)' },
  coder: { bg: 'bg-cyan-900/30', border: 'border-cyan-500', text: 'text-cyan-300', glow: 'rgba(6, 182, 212, 0.3)' },
  analyst: { bg: 'bg-rose-900/30', border: 'border-rose-500', text: 'text-rose-300', glow: 'rgba(244, 63, 94, 0.3)' },
  default: { bg: 'bg-slate-900/30', border: 'border-slate-500', text: 'text-slate-300', glow: 'rgba(100, 116, 139, 0.3)' },
};
