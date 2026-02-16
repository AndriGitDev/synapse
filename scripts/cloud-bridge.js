#!/usr/bin/env node

/**
 * ☁️ SYNAPSE Cloud Bridge (JSONL Version)
 * 
 * Streams Clawdbot events to Pusher for real-time public visualization.
 */

const Pusher = require('pusher');
const fs = require('fs');
const path = require('path');
const readline = require('readline');

// === Load environment ===
try {
  const envPath = path.join(__dirname, '..', '.env.local');
  if (fs.existsSync(envPath)) {
    const envContent = fs.readFileSync(envPath, 'utf-8');
    envContent.split('\n').forEach(line => {
      const [key, ...valueParts] = line.split('=');
      if (key && valueParts.length) {
        process.env[key.trim()] = valueParts.join('=').trim().replace(/^["']|["']$/g, '');
      }
    });
  }
} catch (e) {}

// === Configuration ===
const PUSHER_CONFIG = {
  appId: process.env.PUSHER_APP_ID,
  key: process.env.PUSHER_KEY,
  secret: process.env.PUSHER_SECRET,
  cluster: process.env.PUSHER_CLUSTER || 'eu',
  useTLS: true,
};

const CHANNEL_NAME = 'synapse-live';
const POLL_INTERVAL = 300;
const AGENT_ID = process.env.CLAWDBOT_AGENT || 'main';

if (!PUSHER_CONFIG.appId || !PUSHER_CONFIG.key || !PUSHER_CONFIG.secret) {
  console.error('❌ Missing Pusher config. Set PUSHER_APP_ID, PUSHER_KEY, PUSHER_SECRET');
  process.exit(1);
}

const pusher = new Pusher(PUSHER_CONFIG);

console.log(`
╔══════════════════════════════════════════════════════════════╗
║  ☁️  SYNAPSE Cloud Bridge (JSONL)                             ║
╠══════════════════════════════════════════════════════════════╣
║  Channel: ${CHANNEL_NAME.padEnd(48)}║
║  Cluster: ${PUSHER_CONFIG.cluster.padEnd(48)}║
╚══════════════════════════════════════════════════════════════╝
`);

// === Find session directory ===
const sessionsDir = `/root/.openclaw/agents/${AGENT_ID}/sessions`;

if (!fs.existsSync(sessionsDir)) {
  console.error('❌ Sessions directory not found:', sessionsDir);
  process.exit(1);
}

console.log(`📁 Watching: ${sessionsDir}`);

// === State ===
let currentSessionFile = null;
let lastLineCount = 0;
let lastEventId = null;
let sessionStarted = false;

// === Find most recent session ===
function findCurrentSession() {
  const files = fs.readdirSync(sessionsDir)
    .filter(f => f.endsWith('.jsonl') && !f.endsWith('.lock'))
    .map(f => ({
      name: f,
      path: path.join(sessionsDir, f),
      mtime: fs.statSync(path.join(sessionsDir, f)).mtime,
    }))
    .sort((a, b) => b.mtime - a.mtime);
  
  return files[0]?.path || null;
}

// === Map to Synapse event types ===
function mapToolToEventType(toolName) {
  const map = {
    'Read': 'file_read', 'read': 'file_read',
    'Write': 'file_write', 'write': 'file_write',
    'Edit': 'file_write', 'edit': 'file_write',
    'exec': 'tool_call', 'process': 'tool_call',
    'web_search': 'tool_call', 'web_fetch': 'tool_call',
    'browser': 'tool_call', 'message': 'tool_call',
    'sessions_spawn': 'spawn_agent',
  };
  return map[toolName] || 'tool_call';
}

// === Parse JSONL line to Synapse events ===
function parseLine(line) {
  const events = [];
  
  try {
    const data = JSON.parse(line);
    if (data.type !== 'message') return events;
    
    const msg = data.message;
    if (!msg) return events;
    
    const baseEvent = {
      parentId: lastEventId,
      timestamp: new Date().toISOString(),
    };
    
    if (msg.role === 'user') {
      // Skip system messages
      const content = Array.isArray(msg.content) 
        ? msg.content.find(b => b.type === 'text')?.text 
        : msg.content;
      
      if (!content || content.includes('HEARTBEAT') || content.includes('[Cron') || content.includes('System:')) {
        return events;
      }
      
      events.push({
        ...baseEvent,
        id: `e${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
        type: 'user_message',
        content: String(content).slice(0, 200),
      });
    }
    else if (msg.role === 'assistant' && Array.isArray(msg.content)) {
      for (const block of msg.content) {
        const event = {
          ...baseEvent,
          id: `e${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
        };
        
        if (block.type === 'thinking' && block.thinking) {
          event.type = 'thought';
          event.content = block.thinking.slice(0, 250);
          events.push(event);
        }
        else if (block.type === 'text' && block.text) {
          if (block.text.trim() === 'NO_REPLY' || block.text.trim() === 'HEARTBEAT_OK') continue;
          event.type = 'assistant_message';
          event.content = block.text.slice(0, 250);
          events.push(event);
        }
        else if (block.type === 'toolCall' && block.name) {
          event.id = block.id || event.id;
          event.type = mapToolToEventType(block.name);
          event.metadata = { tool: block.name };
          
          const args = block.arguments || {};
          if (args.path || args.file_path) {
            event.content = `Reading ${path.basename(args.path || args.file_path)}`;
            event.metadata.file = args.path || args.file_path;
          } else if (args.command) {
            event.content = `$ ${String(args.command).slice(0, 80)}`;
          } else if (args.query) {
            event.content = `🔍 ${args.query.slice(0, 80)}`;
          } else if (args.url) {
            event.content = `🌐 ${args.url.slice(0, 80)}`;
          } else {
            event.content = `${block.name}`;
          }
          events.push(event);
        }
      }
    }
    else if (msg.role === 'toolResult') {
      const content = Array.isArray(msg.content) 
        ? msg.content.find(b => b.type === 'text')?.text 
        : String(msg.content);
      
      events.push({
        ...baseEvent,
        id: `e${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
        type: 'tool_result',
        content: String(content || '').slice(0, 150),
        metadata: { success: !String(content).toLowerCase().includes('error') },
        parentId: msg.toolCallId || lastEventId,
      });
    }
  } catch (e) {
    // Ignore parse errors
  }
  
  return events;
}

// === Publish to Pusher ===
async function publish(eventType, data) {
  try {
    await pusher.trigger(CHANNEL_NAME, eventType, data);
    return true;
  } catch (e) {
    console.error('❌ Pusher error:', e.message);
    return false;
  }
}

// === Read new lines from file ===
async function processNewLines() {
  const sessionFile = findCurrentSession();
  if (!sessionFile) return;
  
  // Session changed
  if (sessionFile !== currentSessionFile) {
    console.log(`📂 Session: ${path.basename(sessionFile)}`);
    currentSessionFile = sessionFile;
    lastLineCount = 0;
    lastEventId = null;
    sessionStarted = false;
  }
  
  // Count lines
  const content = fs.readFileSync(sessionFile, 'utf-8');
  const lines = content.trim().split('\n');
  
  if (lines.length <= lastLineCount) return;
  
  // Start session on first new activity
  if (!sessionStarted) {
    await publish('session-start', {
      session: {
        id: path.basename(sessionFile, '.jsonl'),
        name: '🤖 Data (Live)',
        agent: 'clawdbot',
        startedAt: new Date().toISOString(),
      }
    });
    sessionStarted = true;
    console.log('✅ Session started');
  }
  
  // Process new lines
  const newLines = lines.slice(lastLineCount);
  
  for (const line of newLines) {
    if (!line.trim()) continue;
    
    const events = parseLine(line);
    
    for (const event of events) {
      const preview = event.content.slice(0, 50).replace(/\n/g, ' ');
      console.log(`📤 ${event.type}: ${preview}...`);
      
      await publish('event', { event });
      lastEventId = event.id;
      
      // Tiny delay for visual effect
      await new Promise(r => setTimeout(r, 30));
    }
  }
  
  lastLineCount = lines.length;
}

// === Main loop ===
async function poll() {
  await processNewLines();
  setTimeout(poll, POLL_INTERVAL);
}

// === Graceful shutdown ===
process.on('SIGINT', async () => {
  console.log('\n👋 Shutting down...');
  if (sessionStarted) {
    await publish('session-end', {});
  }
  process.exit(0);
});

process.on('SIGTERM', async () => {
  if (sessionStarted) {
    await publish('session-end', {});
  }
  process.exit(0);
});

// Start
poll();
console.log('🎯 Bridge running! Watching for activity...\n');
