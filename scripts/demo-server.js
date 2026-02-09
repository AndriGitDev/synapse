#!/usr/bin/env node

/**
 * SYNAPSE Demo WebSocket Server
 * 
 * Simulates an AI agent sending events for testing Live mode.
 * 
 * Usage:
 *   node scripts/demo-server.js
 *   # Then connect SYNAPSE to ws://localhost:8080/synapse
 */

const { WebSocketServer } = require('ws');

const PORT = 8080;
const wss = new WebSocketServer({ port: PORT, path: '/synapse' });

console.log(`🧠 SYNAPSE Demo Server running on ws://localhost:${PORT}/synapse`);

// Demo events that simulate an AI agent
const demoEvents = [
  { type: 'user_message', content: 'Can you help me build a REST API for a todo app?' },
  { type: 'thought', content: 'User wants a REST API for todos. I should use Express.js with TypeScript for type safety. Will need routes for CRUD operations.' },
  { type: 'decision', content: 'I\'ll create a clean project structure with routes, controllers, and models separated.' },
  { type: 'tool_call', content: 'Creating project directory structure', metadata: { tool: 'exec' } },
  { type: 'tool_result', content: 'Created: src/routes, src/controllers, src/models', metadata: { success: true } },
  { type: 'file_write', content: 'Creating Todo model with TypeScript interface', metadata: { file: 'src/models/Todo.ts', tool: 'write' } },
  { type: 'tool_result', content: 'Successfully wrote Todo.ts', metadata: { success: true } },
  { type: 'file_write', content: 'Creating CRUD routes for todos', metadata: { file: 'src/routes/todos.ts', tool: 'write' } },
  { type: 'thought', content: 'Routes created. Now adding input validation with Zod to prevent invalid data.' },
  { type: 'file_write', content: 'Adding Zod schemas for validation', metadata: { file: 'src/schemas/todo.ts', tool: 'write' } },
  { type: 'tool_call', content: 'Installing dependencies: express, zod, typescript', metadata: { tool: 'exec', duration: 2500 } },
  { type: 'tool_result', content: 'Dependencies installed successfully', metadata: { success: true } },
  { type: 'file_write', content: 'Creating main app entry point', metadata: { file: 'src/index.ts', tool: 'write' } },
  { type: 'tool_call', content: 'Running TypeScript compiler to check for errors', metadata: { tool: 'exec', duration: 1200 } },
  { type: 'tool_result', content: 'No TypeScript errors found ✓', metadata: { success: true } },
  { type: 'assistant_message', content: 'Done! I\'ve created a REST API for todos with:\n\n• Express.js + TypeScript\n• CRUD routes (GET, POST, PUT, DELETE)\n• Zod validation\n• Clean project structure\n\nRun `npm run dev` to start the server on port 3000.' },
];

let eventId = 0;

function generateId() {
  return `live-${Date.now()}-${(eventId++).toString().padStart(4, '0')}`;
}

wss.on('connection', (ws) => {
  console.log('✅ Client connected');
  
  // Send session start
  ws.send(JSON.stringify({
    type: 'session_start',
    session: {
      id: `demo-${Date.now()}`,
      name: 'Building a REST API',
      agent: 'clawdbot',
    }
  }));
  
  // Send events with delays
  let eventIndex = 0;
  let lastEventId = null;
  
  const sendNextEvent = () => {
    if (eventIndex >= demoEvents.length) {
      console.log('📤 All events sent');
      ws.send(JSON.stringify({ type: 'session_end' }));
      return;
    }
    
    const event = demoEvents[eventIndex];
    const id = generateId();
    
    const message = {
      type: 'event',
      event: {
        id,
        type: event.type,
        content: event.content,
        metadata: event.metadata,
        parentId: lastEventId,
        timestamp: new Date().toISOString(),
      }
    };
    
    ws.send(JSON.stringify(message));
    console.log(`📤 Event ${eventIndex + 1}/${demoEvents.length}: ${event.type}`);
    
    lastEventId = id;
    eventIndex++;
    
    // Random delay between 500ms and 1500ms
    const delay = 500 + Math.random() * 1000;
    setTimeout(sendNextEvent, delay);
  };
  
  // Start sending after a short delay
  setTimeout(sendNextEvent, 1000);
  
  ws.on('close', () => {
    console.log('❌ Client disconnected');
  });
  
  ws.on('error', (err) => {
    console.error('WebSocket error:', err);
  });
});

console.log('Waiting for connections...');
console.log('Connect SYNAPSE Live mode to: ws://localhost:8080/synapse');
