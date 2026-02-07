'use client';

import { memo } from 'react';
import { Handle, Position, NodeProps } from 'reactflow';
import { motion } from 'framer-motion';
import { 
  Brain, 
  Wrench, 
  CheckCircle, 
  FileText, 
  FilePlus, 
  GitBranch, 
  AlertCircle,
  User,
  Bot,
  LucideIcon
} from 'lucide-react';
import { SynapseNodeData, EVENT_COLORS, EventType } from '@/lib/types';

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
};

function SynapseNodeComponent({ data, selected }: NodeProps<SynapseNodeData>) {
  const { event, isActive } = data;
  const colors = EVENT_COLORS[event.type];
  const Icon = ICONS[event.type];
  
  // Truncate content for display
  const displayContent = event.content.length > 100 
    ? event.content.slice(0, 100) + '...' 
    : event.content;
  
  // Format tool name if present
  const toolName = event.metadata?.tool;
  
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.8 }}
      animate={{ 
        opacity: 1, 
        scale: 1,
        boxShadow: isActive 
          ? '0 0 20px rgba(139, 92, 246, 0.5)' 
          : selected 
            ? '0 0 15px rgba(99, 102, 241, 0.4)'
            : '0 0 0 rgba(0, 0, 0, 0)'
      }}
      transition={{ duration: 0.3 }}
      className={`
        min-w-[200px] max-w-[280px] p-3 rounded-lg border-2
        ${colors.bg} ${colors.border}
        ${isActive ? 'ring-2 ring-purple-400 ring-offset-2 ring-offset-slate-900' : ''}
        ${selected ? 'ring-2 ring-indigo-400 ring-offset-2 ring-offset-slate-900' : ''}
        backdrop-blur-sm cursor-pointer
        transition-all duration-200
      `}
    >
      {/* Input handle */}
      <Handle
        type="target"
        position={Position.Top}
        className="!bg-slate-400 !w-3 !h-3 !border-2 !border-slate-600"
      />
      
      {/* Header */}
      <div className="flex items-center gap-2 mb-2">
        <div className={`p-1.5 rounded ${colors.bg} ${colors.border} border`}>
          <Icon className={`w-4 h-4 ${colors.text}`} />
        </div>
        <div className="flex-1 min-w-0">
          <div className={`text-xs font-semibold uppercase tracking-wide ${colors.text}`}>
            {event.type.replace('_', ' ')}
          </div>
          {toolName && (
            <div className="text-xs text-slate-400 truncate">
              {toolName}
            </div>
          )}
        </div>
        {isActive && (
          <motion.div
            animate={{ opacity: [1, 0.5, 1] }}
            transition={{ duration: 1, repeat: Infinity }}
            className="w-2 h-2 rounded-full bg-purple-400"
          />
        )}
      </div>
      
      {/* Content */}
      <div className="text-sm text-slate-300 leading-relaxed">
        {displayContent}
      </div>
      
      {/* Metadata badges */}
      {event.metadata && (
        <div className="flex flex-wrap gap-1 mt-2">
          {event.metadata.duration && (
            <span className="text-xs px-1.5 py-0.5 rounded bg-slate-700 text-slate-300">
              {event.metadata.duration}ms
            </span>
          )}
          {event.metadata.file && (
            <span className="text-xs px-1.5 py-0.5 rounded bg-slate-700 text-slate-300 truncate max-w-[150px]">
              {event.metadata.file}
            </span>
          )}
          {event.metadata.success === false && (
            <span className="text-xs px-1.5 py-0.5 rounded bg-red-500/30 text-red-300">
              failed
            </span>
          )}
        </div>
      )}
      
      {/* Output handle */}
      <Handle
        type="source"
        position={Position.Bottom}
        className="!bg-slate-400 !w-3 !h-3 !border-2 !border-slate-600"
      />
    </motion.div>
  );
}

export const SynapseNode = memo(SynapseNodeComponent);
