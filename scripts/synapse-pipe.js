#!/usr/bin/env node

/**
 * 🔌 SYNAPSE Universal Pipe
 * 
 * Pipe ANY agent output into SYNAPSE!
 * 
 * Usage:
 *   # Pipe Claude Code:
 *   claude --json 2>&1 | node scripts/synapse-pipe.js
 * 
 *   # Pipe any command with JSON output:
 *   your-agent --stream | node scripts/synapse-pipe.js
 * 
 *   # Or use the built-in formatter for plain text:
 *   your-agent 2>&1 | node scripts/synapse-pipe.js --text
 * 
 *   # Then connect SYNAPSE to ws://localhost:8080/synapse
 */

const { WebSocketServer } = require('ws');
const readline = require('readline');

const PORT = process.env.SYNAPSE_PORT || 8080;
const isTextMode = process.argv.includes('--text');
const sessionName = process.argv.find((a, i) => process.argv[i-1] === '--name') || 'Live Agent';

// WebSocket server
const wss = new WebSocketServer({ port: PORT, path: '/synapse' });
const clients = new Set();

console.error(`🔌 SYNAPSE Pipe listening on ws://localhost:${PORT}/synapse`);
console.error(`   Mode: ${isTextMode ? 'text' : 'json'}`);
console.error(`   Waiting for input on stdin...\n`);

function broadcast(message) {
  const data = JSON.stringify(message);
  for (const client of clients) {
    if (client.readyState === 1) client.send(data);
  }
}

let eventId = 0;
let lastEventId = null;

function generateId() {
  return `pipe-${Date.now()}-${(eventId++).toString().padStart(4, '0')}`;
}

function sendEvent(type, content, metadata = {}) {
  const id = generateId();
  const event = {
    id,
    type,
    content: String(content).slice(0, 1000),
    metadata,
    parentId: lastEventId,
    timestamp: new Date().toISOString(),
  };
  
  broadcast({ type: 'event', event });
  lastEventId = id;
  
  console.error(`📤 ${type}: ${content.slice(0, 60)}${content.length > 60 ? '...' : ''}`);
}

// Detect event type from content
function detectEventType(content, data = {}) {
  const lower = content.toLowerCase();
  
  // Check for explicit type in JSON
  if (data.type) {
    const typeMap = {
      'thinking': 'thought',
      'thought': 'thought',
      'tool_use': 'tool_call',
      'tool_call': 'tool_call',
      'tool_result': 'tool_result',
      'error': 'error',
      'user': 'user_message',
      'assistant': 'assistant_message',
      'file_read': 'file_read',
      'file_write': 'file_write',
    };
    return typeMap[data.type] || 'tool_call';
  }
  
  // Heuristic detection
  if (lower.includes('error') || lower.includes('failed') || lower.includes('exception')) return 'error';
  if (lower.includes('thinking') || lower.includes('considering') || lower.includes('analyzing')) return 'thought';
  if (lower.includes('reading file') || lower.includes('read:')) return 'file_read';
  if (lower.includes('writing file') || lower.includes('wrote:') || lower.includes('created:')) return 'file_write';
  if (lower.includes('running') || lower.includes('executing') || lower.includes('calling')) return 'tool_call';
  if (lower.includes('result:') || lower.includes('output:') || lower.includes('success')) return 'tool_result';
  if (lower.startsWith('>') || lower.startsWith('user:')) return 'user_message';
  
  return 'assistant_message';
}

// Parse JSON line
function parseJsonLine(line) {
  try {
    const data = JSON.parse(line);
    
    // Handle various JSON formats
    if (data.content) {
      const type = detectEventType(data.content, data);
      sendEvent(type, data.content, data.metadata || {});
    } else if (data.text) {
      const type = detectEventType(data.text, data);
      sendEvent(type, data.text, data.metadata || {});
    } else if (data.message) {
      const type = detectEventType(data.message, data);
      sendEvent(type, data.message, data.metadata || {});
    } else if (data.type && data.name) {
      // Tool use format
      sendEvent('tool_call', `Calling ${data.name}`, { tool: data.name, ...data.input });
    } else {
      // Unknown format, stringify it
      sendEvent('tool_result', JSON.stringify(data).slice(0, 500));
    }
  } catch (e) {
    // Not JSON, treat as text
    parseTextLine(line);
  }
}

// Parse plain text line
function parseTextLine(line) {
  if (!line.trim()) return;
  
  const type = detectEventType(line);
  sendEvent(type, line);
}

// Connection handler
wss.on('connection', (ws) => {
  console.error('✅ SYNAPSE connected');
  clients.add(ws);
  
  ws.send(JSON.stringify({
    type: 'session_start',
    session: {
      id: `pipe-${Date.now()}`,
      name: sessionName,
      agent: 'generic',
    }
  }));
  
  ws.on('close', () => {
    console.error('❌ SYNAPSE disconnected');
    clients.delete(ws);
  });
});

// Read stdin
const rl = readline.createInterface({
  input: process.stdin,
  terminal: false,
});

rl.on('line', (line) => {
  if (isTextMode) {
    parseTextLine(line);
  } else {
    parseJsonLine(line);
  }
});

rl.on('close', () => {
  console.error('📭 Input stream ended');
  broadcast({ type: 'session_end' });
  
  // Keep server running for a bit so client can see the end
  setTimeout(() => process.exit(0), 5000);
});
