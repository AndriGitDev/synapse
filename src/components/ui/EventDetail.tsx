'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { X, Clock, Hash, ArrowRight } from 'lucide-react';
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
import { AgentEvent, EVENT_COLORS, EventType } from '@/lib/types';

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

interface EventDetailProps {
  event: AgentEvent | null;
  onClose: () => void;
}

export function EventDetail({ event, onClose }: EventDetailProps) {
  if (!event) return null;
  
  const colors = EVENT_COLORS[event.type];
  const Icon = ICONS[event.type];
  
  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, x: 20 }}
        animate={{ opacity: 1, x: 0 }}
        exit={{ opacity: 0, x: 20 }}
        className="absolute top-4 right-4 w-80 bg-slate-900/95 backdrop-blur border border-slate-800 rounded-xl shadow-2xl overflow-hidden z-20"
      >
        {/* Header */}
        <div className={`flex items-center justify-between px-4 py-3 ${colors.bg} border-b ${colors.border}`}>
          <div className="flex items-center gap-2">
            <Icon className={`w-5 h-5 ${colors.text}`} />
            <span className={`text-sm font-semibold uppercase tracking-wide ${colors.text}`}>
              {event.type.replace('_', ' ')}
            </span>
          </div>
          <button
            onClick={onClose}
            className="p-1 hover:bg-slate-700/50 rounded transition-colors"
          >
            <X className="w-4 h-4 text-slate-400" />
          </button>
        </div>
        
        {/* Content */}
        <div className="p-4 space-y-4">
          {/* Main content */}
          <div>
            <div className="text-xs text-slate-500 uppercase tracking-wide mb-1">Content</div>
            <p className="text-sm text-slate-200 leading-relaxed">{event.content}</p>
          </div>
          
          {/* Metadata */}
          {event.metadata && Object.keys(event.metadata).length > 0 && (
            <div>
              <div className="text-xs text-slate-500 uppercase tracking-wide mb-2">Metadata</div>
              <div className="space-y-1">
                {event.metadata.tool && (
                  <div className="flex items-center gap-2 text-sm">
                    <Wrench className="w-3 h-3 text-slate-500" />
                    <span className="text-slate-400">Tool:</span>
                    <span className="text-slate-200 font-mono">{event.metadata.tool}</span>
                  </div>
                )}
                {event.metadata.file && (
                  <div className="flex items-center gap-2 text-sm">
                    <FileText className="w-3 h-3 text-slate-500" />
                    <span className="text-slate-400">File:</span>
                    <span className="text-slate-200 font-mono text-xs">{event.metadata.file}</span>
                  </div>
                )}
                {event.metadata.duration && (
                  <div className="flex items-center gap-2 text-sm">
                    <Clock className="w-3 h-3 text-slate-500" />
                    <span className="text-slate-400">Duration:</span>
                    <span className="text-slate-200">{event.metadata.duration}ms</span>
                  </div>
                )}
                {event.metadata.success !== undefined && (
                  <div className="flex items-center gap-2 text-sm">
                    <CheckCircle className={`w-3 h-3 ${event.metadata.success ? 'text-green-500' : 'text-red-500'}`} />
                    <span className="text-slate-400">Status:</span>
                    <span className={event.metadata.success ? 'text-green-400' : 'text-red-400'}>
                      {event.metadata.success ? 'Success' : 'Failed'}
                    </span>
                  </div>
                )}
              </div>
            </div>
          )}
          
          {/* Event ID and timestamp */}
          <div className="pt-2 border-t border-slate-800">
            <div className="flex items-center justify-between text-xs text-slate-500">
              <div className="flex items-center gap-1">
                <Hash className="w-3 h-3" />
                <span className="font-mono">{event.id}</span>
              </div>
              <div>
                {event.timestamp.toLocaleTimeString()}
              </div>
            </div>
            {event.parentId && (
              <div className="flex items-center gap-1 mt-1 text-xs text-slate-500">
                <ArrowRight className="w-3 h-3" />
                <span>from</span>
                <span className="font-mono">{event.parentId}</span>
              </div>
            )}
          </div>
        </div>
      </motion.div>
    </AnimatePresence>
  );
}
