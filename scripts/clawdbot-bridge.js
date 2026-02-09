#!/usr/bin/env node

/**
 * 🌉 SYNAPSE ↔ Clawdbot Bridge
 * 
 * Connects a live Clawdbot session to SYNAPSE for real-time visualization.
 * 
 * Usage:
 *   # Watch the main agent:
 *   node scripts/clawdbot-bridge.js
 * 
 *   # Watch a specific session:
 *   node scripts/clawdbot-bridge.js --session abc123
 * 
 *   # Then connect SYNAPSE to ws://localhost:8080/synapse
 */

const { WebSocketServer } = require('ws');
const { spawn, execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

// === Configuration ===
const PORT = process.env.SYNAPSE_PORT || 8080;
const POLL_INTERVAL = 500; // ms between file checks
const AGENT_ID = process.env.CLAWDBOT_AGENT || 'main';

// Parse CLI args
const args = process.argv.slice(2);
let targetSession = null;
for (let i = 0; i < args.length; i++) {
  if (args[i] === '--session' && args[i + 1]) {
    targetSession = args[i + 1];
  }
}

// === Find Clawdbot session directory ===
function findClawdbotDir() {
  const home = process.env.HOME || process.env.USERPROFILE;
  const possiblePaths = [
    path.join(home, '.clawdbot', 'agents', AGENT_ID),
    path.join(home, '.clawdbot'),
    '/root/.clawdbot/agents/main',
  ];
  
  for (const p of possiblePaths) {
    if (fs.existsSync(p)) return p;
  }
  return null;
}

// === Map Clawdbot tools to Synapse event types ===
function mapToolToEventType(toolName) {
  const toolMap = {
    'read': 'file_read',
    'Read': 'file_read',
    'write': 'file_write',
    'Write': 'file_write',
    'edit': 'file_write',
    'Edit': 'file_write',
    'exec': 'tool_call',
    'process': 'tool_call',
    'web_search': 'tool_call',
    'web_fetch': 'tool_call',
    'browser': 'tool_call',
    'memory_search': 'thought',
    'memory_get': 'file_read',
  };
  return toolMap[toolName] || 'tool_call';
}

// === Parse Clawdbot message into Synapse events ===
function parseMessage(message, lastEventId) {
  const events = [];
  
  if (message.role === 'user') {
    const content = typeof message.content === 'string'
      ? message.content
      : message.content?.find(b => b.type === 'text')?.text || '[user input]';
    
    events.push({
      id: `e${Date.now()}-${Math.random().toString(36).substr(2, 6)}`,
      type: 'user_message',
      content: content.slice(0, 500),
      parentId: lastEventId,
      timestamp: new Date().toISOString(),
    });
  } else if (message.role === 'assistant') {
    const blocks = typeof message.content === 'string'
      ? [{ type: 'text', text: message.content }]
      : message.content || [];
    
    let parentId = lastEventId;
    
    for (const block of blocks) {
      const event = {
        id: `e${Date.now()}-${Math.random().toString(36).substr(2, 6)}`,
        parentId,
        timestamp: new Date().toISOString(),
      };
      
      if (block.type === 'thinking' && block.thinking) {
        event.type = 'thought';
        event.content = block.thinking.slice(0, 500);
        events.push(event);
      } else if (block.type === 'text' && block.text) {
        event.type = 'assistant_message';
        event.content = block.text.slice(0, 500);
        events.push(event);
      } else if (block.type === 'tool_use' && block.name) {
        event.id = block.id || event.id;
        event.type = mapToolToEventType(block.name);
        event.content = `Calling ${block.name}`;
        event.metadata = { tool: block.name };
        
        if (block.input?.path) event.metadata.file = block.input.path;
        if (block.input?.file_path) event.metadata.file = block.input.file_path;
        if (block.input?.command) event.metadata.command = String(block.input.command).slice(0, 100);
        if (block.input?.query) event.metadata.query = block.input.query;
        
        events.push(event);
      } else if (block.type === 'tool_result') {
        const content = typeof block.content === 'string'
          ? block.content
          : JSON.stringify(block.content);
        
        event.type = 'tool_result';
        event.content = content.slice(0, 500);
        event.metadata = { success: !content.toLowerCase().includes('error') };
        event.parentId = block.tool_use_id || parentId;
        events.push(event);
      }
      
      if (events.length > 0) {
        parentId = events[events.length - 1].id;
      }
    }
  }
  
  return events;
}

// === WebSocket Server ===
const wss = new WebSocketServer({ port: PORT, path: '/synapse' });
const clients = new Set();

console.log(`
╔══════════════════════════════════════════════════════════════╗
║  🌉 SYNAPSE ↔ Clawdbot Bridge                                ║
╠══════════════════════════════════════════════════════════════╣
║  WebSocket: ws://localhost:${PORT}/synapse                     ║
║  Agent: ${AGENT_ID.padEnd(52)}║
╚══════════════════════════════════════════════════════════════╝
`);

function broadcast(message) {
  const data = JSON.stringify(message);
  for (const client of clients) {
    if (client.readyState === 1) { // WebSocket.OPEN
      client.send(data);
    }
  }
}

wss.on('connection', (ws) => {
  console.log('✅ SYNAPSE connected');
  clients.add(ws);
  
  // Send session start
  ws.send(JSON.stringify({
    type: 'session_start',
    session: {
      id: `clawdbot-${Date.now()}`,
      name: `Clawdbot Live (${AGENT_ID})`,
      agent: 'clawdbot',
    }
  }));
  
  ws.on('close', () => {
    console.log('❌ SYNAPSE disconnected');
    clients.delete(ws);
  });
});

// === Session Watching ===
const clawdbotDir = findClawdbotDir();
if (!clawdbotDir) {
  console.error('❌ Could not find Clawdbot directory');
  console.error('   Make sure Clawdbot is installed and has run at least once.');
  process.exit(1);
}

console.log(`📁 Watching: ${clawdbotDir}`);

// Track what we've already sent
let lastMessageCount = 0;
let lastEventId = null;
let currentSessionFile = null;

// Find the most recent session file
function findCurrentSession() {
  const sessionsDir = path.join(clawdbotDir, 'sessions');
  if (!fs.existsSync(sessionsDir)) return null;
  
  const files = fs.readdirSync(sessionsDir)
    .filter(f => f.endsWith('.json'))
    .map(f => ({
      name: f,
      path: path.join(sessionsDir, f),
      mtime: fs.statSync(path.join(sessionsDir, f)).mtime,
    }))
    .sort((a, b) => b.mtime - a.mtime);
  
  // If targeting specific session, find it
  if (targetSession) {
    const match = files.find(f => f.name.includes(targetSession));
    return match?.path || null;
  }
  
  return files[0]?.path || null;
}

// Poll for changes
function pollSession() {
  const sessionFile = findCurrentSession();
  
  if (!sessionFile) {
    setTimeout(pollSession, POLL_INTERVAL);
    return;
  }
  
  // Detect session change
  if (sessionFile !== currentSessionFile) {
    console.log(`📂 Watching session: ${path.basename(sessionFile)}`);
    currentSessionFile = sessionFile;
    lastMessageCount = 0;
    lastEventId = null;
    
    // Notify clients of new session
    broadcast({
      type: 'session_start',
      session: {
        id: path.basename(sessionFile, '.json'),
        name: `Clawdbot Live`,
        agent: 'clawdbot',
      }
    });
  }
  
  try {
    const data = JSON.parse(fs.readFileSync(sessionFile, 'utf-8'));
    const messages = data.messages || [];
    
    // Process new messages
    if (messages.length > lastMessageCount) {
      const newMessages = messages.slice(lastMessageCount);
      
      for (const message of newMessages) {
        const events = parseMessage(message, lastEventId);
        
        for (const event of events) {
          console.log(`📤 ${event.type}: ${event.content.slice(0, 50)}...`);
          broadcast({ type: 'event', event });
          lastEventId = event.id;
        }
      }
      
      lastMessageCount = messages.length;
    }
  } catch (err) {
    // File might be mid-write, ignore
  }
  
  setTimeout(pollSession, POLL_INTERVAL);
}

// Start polling
pollSession();

console.log(`
🎯 Instructions:
   1. Open SYNAPSE and go to Live mode
   2. Connect to: ws://localhost:${PORT}/synapse
   3. Start chatting with Clawdbot - events will appear in real-time!

   Press Ctrl+C to stop.
`);
