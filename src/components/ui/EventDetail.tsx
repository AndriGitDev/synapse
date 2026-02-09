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

const TYPE_LABELS: Record<EventType, string> = {
  thought: 'Thinking',
  tool_call: 'Tool Call',
  tool_result: 'Result',
  file_read: 'Reading File',
  file_write: 'Writing File',
  decision: 'Decision',
  error: 'Error',
  user_message: 'User Message',
  assistant_message: 'Response',
};

interface EventDetailProps {
  event: AgentEvent | null;
  onClose: () => void;
}

export function EventDetail({ event, onClose }: EventDetailProps) {
  return (
    <AnimatePresence>
      {event && (
        <motion.div
          initial={{ opacity: 0, x: 20, scale: 0.95 }}
          animate={{ opacity: 1, x: 0, scale: 1 }}
          exit={{ opacity: 0, x: 20, scale: 0.95 }}
          transition={{ duration: 0.2, ease: [0.23, 1, 0.32, 1] }}
          className="absolute top-4 right-4 w-80 bg-slate-900/95 backdrop-blur-xl border border-slate-700/50 rounded-2xl shadow-2xl overflow-hidden z-20"
        >
          <EventDetailContent event={event} onClose={onClose} />
        </motion.div>
      )}
    </AnimatePresence>
  );
}

function EventDetailContent({ event, onClose }: { event: AgentEvent; onClose: () => void }) {
  const colors = EVENT_COLORS[event.type];
  const Icon = ICONS[event.type];
  const label = TYPE_LABELS[event.type];
  
  return (
    <>
      {/* Header */}
      <div className={`flex items-center justify-between px-4 py-3 ${colors.bg} border-b border-slate-700/30`}>
        <div className="flex items-center gap-2">
          <div className={`p-1.5 rounded-lg ${colors.bg} border ${colors.border}/30`}>
            <Icon className={`w-4 h-4 ${colors.text}`} />
          </div>
          <span className={`text-sm font-semibold ${colors.text}`}>
            {label}
          </span>
        </div>
        <button
          onClick={onClose}
          className="p-1.5 hover:bg-slate-700/50 rounded-lg transition-colors"
        >
          <X className="w-4 h-4 text-slate-400" />
        </button>
      </div>
      
      {/* Content */}
      <div className="p-4 space-y-4">
        {/* Main content */}
        <div>
          <p className="text-sm text-slate-200 leading-relaxed">{event.content}</p>
        </div>
        
        {/* Metadata */}
        {event.metadata && Object.keys(event.metadata).length > 0 && (
          <div className="space-y-2">
            <div className="text-[10px] text-slate-500 uppercase tracking-wider font-medium">Details</div>
            <div className="space-y-1.5">
              {event.metadata.tool && (
                <div className="flex items-center gap-2 text-sm">
                  <Wrench className="w-3.5 h-3.5 text-slate-600" />
                  <span className="text-slate-500">Tool</span>
                  <span className="text-slate-300 font-mono text-xs ml-auto bg-slate-800 px-2 py-0.5 rounded">
                    {event.metadata.tool}
                  </span>
                </div>
              )}
              {event.metadata.file && (
                <div className="flex items-center gap-2 text-sm">
                  <FileText className="w-3.5 h-3.5 text-slate-600" />
                  <span className="text-slate-500">File</span>
                  <span className="text-cyan-400 font-mono text-xs ml-auto bg-slate-800 px-2 py-0.5 rounded truncate max-w-[140px]">
                    {event.metadata.file}
                  </span>
                </div>
              )}
              {event.metadata.duration && (
                <div className="flex items-center gap-2 text-sm">
                  <Clock className="w-3.5 h-3.5 text-slate-600" />
                  <span className="text-slate-500">Duration</span>
                  <span className="text-slate-300 ml-auto">
                    {event.metadata.duration}ms
                  </span>
                </div>
              )}
              {event.metadata.success !== undefined && (
                <div className="flex items-center gap-2 text-sm">
                  <CheckCircle className={`w-3.5 h-3.5 ${event.metadata.success ? 'text-green-500' : 'text-red-500'}`} />
                  <span className="text-slate-500">Status</span>
                  <span className={`ml-auto ${event.metadata.success ? 'text-green-400' : 'text-red-400'}`}>
                    {event.metadata.success ? 'Success' : 'Failed'}
                  </span>
                </div>
              )}
            </div>
          </div>
        )}
        
        {/* Footer */}
        <div className="pt-3 border-t border-slate-800">
          <div className="flex items-center justify-between text-[10px] text-slate-600">
            <div className="flex items-center gap-1 font-mono">
              <Hash className="w-3 h-3" />
              {event.id}
            </div>
            <div>
              {event.timestamp.toLocaleTimeString()}
            </div>
          </div>
          {event.parentId && (
            <div className="flex items-center gap-1 mt-1.5 text-[10px] text-slate-600">
              <ArrowRight className="w-3 h-3" />
              <span>from</span>
              <span className="font-mono">{event.parentId}</span>
            </div>
          )}
        </div>
      </div>
    </>
  );
}
