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
  Sparkles,
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
};

function SynapseNodeComponent({ data, selected }: NodeProps<SynapseNodeData>) {
  const { event, isActive } = data;
  const colors = EVENT_COLORS[event.type];
  const Icon = ICONS[event.type];
  const label = TYPE_LABELS[event.type];
  
  // Truncate content for display
  const displayContent = event.content.length > 80 
    ? event.content.slice(0, 80) + '...' 
    : event.content;
  
  // Format tool name if present
  const toolName = event.metadata?.tool;
  const fileName = event.metadata?.file;
  
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
        ease: [0.23, 1, 0.32, 1] // Smooth ease-out
      }}
      className={`
        min-w-[220px] max-w-[280px] rounded-xl overflow-hidden
        ${isActive ? 'ring-2 ring-purple-400/50 ring-offset-2 ring-offset-slate-950' : ''}
        ${selected ? 'ring-2 ring-indigo-400/50 ring-offset-2 ring-offset-slate-950' : ''}
        transition-shadow duration-300
        cursor-pointer
      `}
      style={{
        boxShadow: isActive 
          ? '0 0 30px rgba(139, 92, 246, 0.3), 0 4px 20px rgba(0, 0, 0, 0.4)' 
          : '0 4px 20px rgba(0, 0, 0, 0.3)'
      }}
    >
      {/* Input handle (left side for horizontal layout) */}
      <Handle
        type="target"
        position={Position.Left}
        className="!bg-slate-500 !w-2.5 !h-2.5 !border-2 !border-slate-700 !-left-1"
      />
      
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
      
      {/* Output handle (right side for horizontal layout) */}
      <Handle
        type="source"
        position={Position.Right}
        className="!bg-slate-500 !w-2.5 !h-2.5 !border-2 !border-slate-700 !-right-1"
      />
    </motion.div>
  );
}

export const SynapseNode = memo(SynapseNodeComponent);
