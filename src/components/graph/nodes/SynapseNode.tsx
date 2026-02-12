'use client';

import { memo } from 'react';
import { Handle, Position, NodeProps } from 'reactflow';
import { motion } from 'framer-motion';
import { 
  Brain, 
  Wrench, 
  CheckCircle,
  CheckCircle2,
  FileText, 
  FilePlus, 
  GitBranch, 
  AlertCircle,
  User,
  Bot,
  Sparkles,
  ArrowRightLeft,
  Flag,
  LucideIcon
} from 'lucide-react';
import { SynapseNodeData, EVENT_COLORS, EventType, AGENT_COLORS } from '@/lib/types';

const ICONS: Record<EventType, LucideIcon> = {
  thought: Brain,
  tool_call: Wrench,
  tool_result: CheckCircle,
  file_read: FileText,
  file_write: FilePlus,
  decision: GitBranch,
  error: AlertCircle,
  user_message: User,
  assistant_message: Bot,
  spawn_agent: Sparkles,
  agent_complete: CheckCircle2,
  agent_handoff: ArrowRightLeft,
};

const TYPE_LABELS: Record<EventType, string> = {
  thought: 'Thinking',
  tool_call: 'Tool Call',
  tool_result: 'Result',
  file_read: 'Reading',
  file_write: 'Writing',
  decision: 'Decision',
  error: 'Error',
  user_message: 'User',
  assistant_message: 'Response',
  spawn_agent: 'Spawn Agent',
  agent_complete: 'Agent Done',
  agent_handoff: 'Handoff',
};

function SynapseNodeComponent({ data, selected }: NodeProps<SynapseNodeData>) {
  const { event, isActive, agent, isFinal } = data;
  const colors = EVENT_COLORS[event.type];
  const Icon = ICONS[event.type];
  const label = TYPE_LABELS[event.type];
  
  // Get agent-specific colors if available
  const agentRole = agent?.role || 'default';
  const agentColors = AGENT_COLORS[agentRole] || AGENT_COLORS.default;
  
  // Truncate content for display
  const displayContent = event.content.length > 140 
    ? event.content.slice(0, 140) + '...' 
    : event.content;
  
  // Format tool name if present
  const toolName = event.metadata?.tool;
  const fileName = event.metadata?.file;
  const spawnedAgent = event.metadata?.spawnedAgent;
  
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.8, x: -20 }}
      animate={{ 
        opacity: 1, 
        scale: 1,
        x: 0,
      }}
      transition={{ 
        duration: 0.3,
        ease: [0.23, 1, 0.32, 1]
      }}
      className={`
        min-w-[280px] max-w-[360px] rounded-xl overflow-hidden
        ${isActive ? 'ring-2 ring-purple-400/50 ring-offset-2 ring-offset-slate-950' : ''}
        ${selected ? 'ring-2 ring-indigo-400/50 ring-offset-2 ring-offset-slate-950' : ''}
        ${isFinal ? 'ring-2 ring-emerald-400/70 ring-offset-2 ring-offset-slate-950' : ''}
        ${agent ? `border-l-4 ${agentColors.border}` : ''}
        transition-shadow duration-300
        cursor-pointer
      `}
      style={{
        boxShadow: isFinal
          ? '0 0 40px rgba(16, 185, 129, 0.4), 0 4px 20px rgba(0, 0, 0, 0.4)'
          : isActive 
            ? `0 0 30px ${agent ? agentColors.glow : 'rgba(139, 92, 246, 0.3)'}, 0 4px 20px rgba(0, 0, 0, 0.4)` 
            : '0 4px 20px rgba(0, 0, 0, 0.3)'
      }}
    >
      {/* Input handles - Left for horizontal, Top for vertical */}
      <Handle
        type="target"
        position={Position.Left}
        id="left"
        className="!bg-slate-500 !w-2.5 !h-2.5 !border-2 !border-slate-700 !-left-1"
      />
      <Handle
        type="target"
        position={Position.Top}
        id="top"
        className="!bg-slate-500 !w-2.5 !h-2.5 !border-2 !border-slate-700 !-top-1"
      />
      
      {/* Agent badge (if multi-agent session) */}
      {agent && (
        <div className={`flex items-center gap-1.5 px-3 py-1.5 ${agentColors.bg} border-b ${agentColors.border}/30`}>
          <div className={`w-2 h-2 rounded-full ${agentColors.border.replace('border-', 'bg-')}`} />
          <span className={`text-[10px] font-bold uppercase tracking-wider ${agentColors.text}`}>
            {agent.name}
          </span>
        </div>
      )}
      
      {/* Header bar */}
      <div className={`flex items-center gap-2 px-3 py-2 ${colors.bg} border-b ${colors.border}/30`}>
        <div className={`p-1 rounded ${colors.bg}`}>
          <Icon className={`w-3.5 h-3.5 ${colors.text}`} />
        </div>
        <span className={`text-xs font-semibold uppercase tracking-wider ${colors.text}`}>
          {label}
        </span>
        {isActive && (
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            className="ml-auto"
          >
            <Sparkles className="w-3.5 h-3.5 text-purple-400" />
          </motion.div>
        )}
      </div>
      
      {/* Content */}
      <div className="bg-slate-900/90 backdrop-blur-sm px-3 py-3">
        {/* Spawned agent info */}
        {spawnedAgent && (
          <div className="flex items-center gap-2 mb-2 p-2 rounded-lg bg-pink-500/10 border border-pink-500/30">
            <Sparkles className="w-4 h-4 text-pink-400" />
            <div>
              <span className="text-xs font-semibold text-pink-300">{spawnedAgent.name}</span>
              {spawnedAgent.role && (
                <span className="text-[10px] text-pink-400/70 ml-1.5">({spawnedAgent.role})</span>
              )}
            </div>
          </div>
        )}
        
        {/* Tool/File badge */}
        {(toolName || fileName) && (
          <div className="flex flex-wrap gap-1.5 mb-2">
            {toolName && (
              <span className="inline-flex items-center gap-1 text-[10px] px-1.5 py-0.5 rounded bg-slate-800 text-slate-400 font-mono">
                {toolName}
              </span>
            )}
            {fileName && (
              <span className="inline-flex items-center gap-1 text-[10px] px-1.5 py-0.5 rounded bg-slate-800 text-cyan-400 font-mono truncate max-w-[180px]">
                {fileName.split('/').pop()}
              </span>
            )}
          </div>
        )}
        
        {/* Main content */}
        <p className="text-sm text-slate-300 leading-relaxed">
          {displayContent}
        </p>
        
        {/* Status indicators */}
        {event.metadata?.success !== undefined && (
          <div className="flex items-center gap-1.5 mt-2 pt-2 border-t border-slate-800">
            <div className={`w-1.5 h-1.5 rounded-full ${event.metadata.success ? 'bg-green-500' : 'bg-red-500'}`} />
            <span className={`text-[10px] ${event.metadata.success ? 'text-green-400' : 'text-red-400'}`}>
              {event.metadata.success ? 'Success' : 'Failed'}
            </span>
            {event.metadata.duration && (
              <span className="text-[10px] text-slate-600 ml-auto">
                {event.metadata.duration}ms
              </span>
            )}
          </div>
        )}
      </div>
      
      {/* Final response indicator */}
      {isFinal && (
        <motion.div 
          initial={{ opacity: 0, y: 5 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-center justify-center gap-1.5 px-3 py-2 bg-emerald-500/20 border-t border-emerald-500/30"
        >
          <Flag className="w-3.5 h-3.5 text-emerald-400" />
          <span className="text-[11px] font-semibold text-emerald-400 uppercase tracking-wider">
            Session Complete
          </span>
        </motion.div>
      )}
      
      {/* Output handles - Right for horizontal, Bottom for vertical */}
      <Handle
        type="source"
        position={Position.Right}
        id="right"
        className="!bg-slate-500 !w-2.5 !h-2.5 !border-2 !border-slate-700 !-right-1"
      />
      <Handle
        type="source"
        position={Position.Bottom}
        id="bottom"
        className="!bg-slate-500 !w-2.5 !h-2.5 !border-2 !border-slate-700 !-bottom-1"
      />
    </motion.div>
  );
}

export const SynapseNode = memo(SynapseNodeComponent);
