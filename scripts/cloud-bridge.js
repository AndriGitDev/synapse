#!/usr/bin/env node

/**
 * ☁️ SYNAPSE Cloud Bridge
 * 
 * Streams Clawdbot events to Pusher for real-time public visualization.
 * Anyone with the Synapse URL can watch the agent think live.
 * 
 * Setup:
 *   1. Create a free Pusher account at https://pusher.com
 *   2. Create a new Channels app
 *   3. Set environment variables (or create .env.local):
 *      - PUSHER_APP_ID
 *      - PUSHER_KEY
 *      - PUSHER_SECRET
 *      - PUSHER_CLUSTER
 * 
 * Usage:
 *   node scripts/cloud-bridge.js
 */

const Pusher = require('pusher');
const fs = require('fs');
const path = require('path');

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
} catch (e) {
  // Ignore env loading errors
}

// === Configuration ===
const PUSHER_CONFIG = {
  appId: process.env.PUSHER_APP_ID,
  key: process.env.PUSHER_KEY,
  secret: process.env.PUSHER_SECRET,
  cluster: process.env.PUSHER_CLUSTER || 'eu',
  useTLS: true,
};

const CHANNEL_NAME = 'synapse-live';
const POLL_INTERVAL = 500;
const AGENT_ID = process.env.CLAWDBOT_AGENT || 'main';

// Validate config
if (!PUSHER_CONFIG.appId || !PUSHER_CONFIG.key || !PUSHER_CONFIG.secret) {
  console.error(`
╔══════════════════════════════════════════════════════════════╗
║  ❌ Missing Pusher Configuration                             ║
╠══════════════════════════════════════════════════════════════╣
║  Set these environment variables:                            ║
║                                                              ║
║    PUSHER_APP_ID=your_app_id                                 ║
║    PUSHER_KEY=your_key                                       ║
║    PUSHER_SECRET=your_secret                                 ║
║    PUSHER_CLUSTER=eu  (or your cluster)                      ║
║                                                              ║
║  Get these from https://dashboard.pusher.com                 ║
╚══════════════════════════════════════════════════════════════╝
`);
  process.exit(1);
}

const pusher = new Pusher(PUSHER_CONFIG);

console.log(`
╔══════════════════════════════════════════════════════════════╗
║  ☁️  SYNAPSE Cloud Bridge                                     ║
╠══════════════════════════════════════════════════════════════╣
║  Pusher Channel: ${CHANNEL_NAME.padEnd(41)}║
║  Cluster: ${PUSHER_CONFIG.cluster.padEnd(49)}║
║  Agent: ${AGENT_ID.padEnd(51)}║
╚══════════════════════════════════════════════════════════════╝
`);

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
    'message': 'tool_call',
    'sessions_spawn': 'spawn_agent',
  };
  return toolMap[toolName] || 'tool_call';
}

// === Parse Clawdbot message into Synapse events ===
function parseMessage(message, lastEventId) {
  const events = [];
  
  if (message.role === 'user') {
    // Skip system/heartbeat messages for the live demo
    const content = typeof message.content === 'string'
      ? message.content
      : message.content?.find(b => b.type === 'text')?.text || '';
    
    if (content.includes('HEARTBEAT') || content.includes('Cron:')) {
      return events; // Skip heartbeats and cron messages
    }
    
    events.push({
      id: `e${Date.now()}-${Math.random().toString(36).substr(2, 6)}`,
      type: 'user_message',
      content: content.slice(0, 300),
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
        event.content = block.thinking.slice(0, 300);
        events.push(event);
        parentId = event.id;
      } else if (block.type === 'text' && block.text) {
        // Skip NO_REPLY and HEARTBEAT_OK
        if (block.text.trim() === 'NO_REPLY' || block.text.trim() === 'HEARTBEAT_OK') {
          continue;
        }
        event.type = 'assistant_message';
        event.content = block.text.slice(0, 300);
        events.push(event);
        parentId = event.id;
      } else if (block.type === 'tool_use' && block.name) {
        event.id = block.id || event.id;
        event.type = mapToolToEventType(block.name);
        event.content = `${block.name}`;
        event.metadata = { tool: block.name };
        
        // Add context based on tool
        if (block.input?.path) {
          event.metadata.file = block.input.path;
          event.content = `Reading ${path.basename(block.input.path)}`;
        }
        if (block.input?.file_path) {
          event.metadata.file = block.input.file_path;
        }
        if (block.input?.command) {
          event.content = `Running: ${String(block.input.command).slice(0, 60)}`;
        }
        if (block.input?.query) {
          event.content = `Searching: ${block.input.query.slice(0, 60)}`;
        }
        if (block.input?.url) {
          event.content = `Fetching: ${block.input.url.slice(0, 60)}`;
        }
        if (block.name === 'sessions_spawn') {
          event.content = `Spawning sub-agent: ${block.input?.task?.slice(0, 60) || 'task'}`;
        }
        
        events.push(event);
        parentId = event.id;
      } else if (block.type === 'tool_result') {
        const content = typeof block.content === 'string'
          ? block.content
          : JSON.stringify(block.content);
        
        event.type = 'tool_result';
        event.content = content.slice(0, 200);
        event.metadata = { 
          success: !content.toLowerCase().includes('error') && !content.toLowerCase().includes('failed')
        };
        event.parentId = block.tool_use_id || parentId;
        events.push(event);
        parentId = event.id;
      }
    }
  }
  
  return events;
}

// === Session State ===
const clawdbotDir = findClawdbotDir();
if (!clawdbotDir) {
  console.error('❌ Could not find Clawdbot directory');
  process.exit(1);
}

console.log(`📁 Watching: ${clawdbotDir}`);

let lastMessageCount = 0;
let lastEventId = null;
let currentSessionFile = null;
let currentSessionId = null;
let isSessionActive = false;

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
  
  return files[0]?.path || null;
}

// Publish event to Pusher
async function publishEvent(eventType, data) {
  try {
    await pusher.trigger(CHANNEL_NAME, eventType, data);
    return true;
  } catch (err) {
    console.error(`❌ Pusher error: ${err.message}`);
    return false;
  }
}

// Poll for changes
async function pollSession() {
  const sessionFile = findCurrentSession();
  
  if (!sessionFile) {
    setTimeout(pollSession, POLL_INTERVAL);
    return;
  }
  
  // Detect session change
  if (sessionFile !== currentSessionFile) {
    const sessionId = path.basename(sessionFile, '.json');
    console.log(`📂 New session: ${sessionId}`);
    currentSessionFile = sessionFile;
    currentSessionId = sessionId;
    lastMessageCount = 0;
    lastEventId = null;
    
    // Notify of new session
    await publishEvent('session-start', {
      session: {
        id: sessionId,
        name: '🤖 Data (Live)',
        agent: 'clawdbot',
        startedAt: new Date().toISOString(),
      }
    });
    isSessionActive = true;
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
          const preview = event.content.slice(0, 40).replace(/\n/g, ' ');
          console.log(`📤 ${event.type}: ${preview}...`);
          
          await publishEvent('event', { event });
          lastEventId = event.id;
          
          // Small delay between events for visual effect
          await new Promise(r => setTimeout(r, 50));
        }
      }
      
      lastMessageCount = messages.length;
    }
  } catch (err) {
    // File might be mid-write, ignore
  }
  
  setTimeout(pollSession, POLL_INTERVAL);
}

// Graceful shutdown
process.on('SIGINT', async () => {
  console.log('\n👋 Shutting down...');
  if (isSessionActive) {
    await publishEvent('session-end', { sessionId: currentSessionId });
  }
  process.exit(0);
});

// Start polling
pollSession();

console.log(`
🎯 Bridge is running!
   
   Events will be pushed to Pusher channel: ${CHANNEL_NAME}
   Anyone with SYNAPSE can watch at: https://synapse.andri.is
   
   Press Ctrl+C to stop.
`);
