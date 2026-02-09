'use client';

import { useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Upload, FileJson, AlertCircle, CheckCircle, X } from 'lucide-react';
import { parseSessionJson } from '@/lib/parsers';
import { AgentSession } from '@/lib/types';

interface FileUploadProps {
  onSessionLoaded: (session: AgentSession) => void;
}

export function FileUpload({ onSessionLoaded }: FileUploadProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const [error, setError] = useState<string | null>(null);
  const [fileName, setFileName] = useState<string | null>(null);
  
  const processFile = useCallback(async (file: File) => {
    setStatus('loading');
    setError(null);
    setFileName(file.name);
    
    try {
      const text = await file.text();
      const result = parseSessionJson(text);
      
      if (result.success) {
        setStatus('success');
        setTimeout(() => {
          onSessionLoaded(result.session);
        }, 500);
      } else {
        setStatus('error');
        setError(result.error);
      }
    } catch (e) {
      setStatus('error');
      setError(e instanceof Error ? e.message : 'Failed to read file');
    }
  }, [onSessionLoaded]);
  
  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    
    const file = e.dataTransfer.files[0];
    if (file && (file.type === 'application/json' || file.name.endsWith('.json'))) {
      processFile(file);
    } else {
      setStatus('error');
      setError('Please drop a JSON file');
    }
  }, [processFile]);
  
  const handleFileInput = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      processFile(file);
    }
  }, [processFile]);
  
  const reset = () => {
    setStatus('idle');
    setError(null);
    setFileName(null);
  };
  
  return (
    <div className="w-full max-w-md">
      <AnimatePresence mode="wait">
        {status === 'idle' && (
          <motion.div
            key="dropzone"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <label
              onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
              onDragLeave={() => setIsDragging(false)}
              onDrop={handleDrop}
              className={`
                flex flex-col items-center justify-center p-8 
                border-2 border-dashed rounded-xl cursor-pointer
                transition-all duration-200
                ${isDragging 
                  ? 'border-indigo-500 bg-indigo-500/10' 
                  : 'border-slate-700 hover:border-slate-600 hover:bg-slate-800/50'
                }
              `}
            >
              <input
                type="file"
                accept=".json,application/json"
                onChange={handleFileInput}
                className="hidden"
              />
              <div className={`
                w-12 h-12 rounded-full flex items-center justify-center mb-4
                ${isDragging ? 'bg-indigo-500/20' : 'bg-slate-800'}
              `}>
                <Upload className={`w-6 h-6 ${isDragging ? 'text-indigo-400' : 'text-slate-400'}`} />
              </div>
              <p className="text-slate-300 font-medium mb-1">
                {isDragging ? 'Drop to upload' : 'Drop session file here'}
              </p>
              <p className="text-slate-500 text-sm">
                or click to browse
              </p>
            </label>
            
            {/* Supported formats */}
            <div className="mt-4 text-center">
              <p className="text-xs text-slate-500">Supported formats:</p>
              <div className="flex justify-center gap-2 mt-2">
                <span className="flex items-center gap-1 px-2 py-1 bg-slate-800 rounded text-xs text-slate-400">
                  <FileJson className="w-3 h-3" />
                  Clawdbot
                </span>
                <span className="flex items-center gap-1 px-2 py-1 bg-slate-800/50 rounded text-xs text-slate-500">
                  <FileJson className="w-3 h-3" />
                  LangChain (soon)
                </span>
              </div>
            </div>
          </motion.div>
        )}
        
        {status === 'loading' && (
          <motion.div
            key="loading"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="flex flex-col items-center p-8"
          >
            <div className="w-12 h-12 rounded-full bg-indigo-500/20 flex items-center justify-center mb-4">
              <motion.div
                animate={{ rotate: 360 }}
                transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
              >
                <Upload className="w-6 h-6 text-indigo-400" />
              </motion.div>
            </div>
            <p className="text-slate-300">Parsing {fileName}...</p>
          </motion.div>
        )}
        
        {status === 'success' && (
          <motion.div
            key="success"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="flex flex-col items-center p-8"
          >
            <div className="w-12 h-12 rounded-full bg-green-500/20 flex items-center justify-center mb-4">
              <CheckCircle className="w-6 h-6 text-green-400" />
            </div>
            <p className="text-green-400 font-medium">Session loaded!</p>
            <p className="text-slate-500 text-sm">{fileName}</p>
          </motion.div>
        )}
        
        {status === 'error' && (
          <motion.div
            key="error"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="flex flex-col items-center p-8"
          >
            <div className="w-12 h-12 rounded-full bg-red-500/20 flex items-center justify-center mb-4">
              <AlertCircle className="w-6 h-6 text-red-400" />
            </div>
            <p className="text-red-400 font-medium mb-1">Failed to parse</p>
            <p className="text-slate-500 text-sm text-center mb-4">{error}</p>
            <button
              onClick={reset}
              className="flex items-center gap-2 px-4 py-2 bg-slate-800 hover:bg-slate-700 rounded-lg text-sm transition-colors"
            >
              <X className="w-4 h-4" />
              Try again
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
