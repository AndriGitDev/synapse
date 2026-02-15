import { AgentSession, AgentEvent, EventType } from '../types';

/**
 * Parse Clawdbot session history into SYNAPSE format
 * 
 * Clawdbot sessions have this structure:
 * {
 *   messages: [
 *     { role: 'user' | 'assistant', content: string | ContentBlock[] }
 *   ]
 * }
 * 
 * ContentBlock can be:
 * - { type: 'text', text: string }
 * - { type: 'tool_use', name: string, input: object }
 * - { type: 'tool_result', tool_use_id: string, content: string }
 */

interface ClawdbotMessage {
  role: 'user' | 'assistant';
  content: string | ClawdbotContentBlock[];
}

interface ClawdbotContentBlock {
  type: 'text' | 'tool_use' | 'tool_result' | 'thinking';
  text?: string;
  name?: string;
  input?: Record<string, unknown>;
  tool_use_id?: string;
  content?: string;
  thinking?: string;
}

interface ClawdbotSession {
  messages: ClawdbotMessage[];
  sessionId?: string;
  agentId?: string;
  createdAt?: string;
}

function mapToolToEventType(toolName: string): EventType {
  const toolMap: Record<string, EventType> = {
    'read': 'file_read',
    'Read': 'file_read',
    'write': 'file_write',
    'Write': 'file_write',
    'edit': 'file_write',
    'Edit': 'file_write',
    'exec': 'tool_call',
    'web_search': 'tool_call',
    'web_fetch': 'tool_call',
    'browser': 'tool_call',
  };
  return toolMap[toolName] || 'tool_call';
}

function generateId(): string {
  return `e${Math.random().toString(36).substr(2, 9)}`;
}

export function parseClawdbotSession(data: ClawdbotSession): AgentSession {
  const events: AgentEvent[] = [];
  let eventIndex = 0;
  const baseTime = data.createdAt ? new Date(data.createdAt) : new Date();
  
  for (const message of data.messages) {
    const messageTime = new Date(baseTime.getTime() + eventIndex * 1000);
    
    if (message.role === 'user') {
      // User message
      const content = typeof message.content === 'string' 
        ? message.content 
        : message.content.find(b => b.type === 'text')?.text || '';
      
      events.push({
        id: generateId(),
        timestamp: messageTime,
        type: 'user_message',
        content: content.slice(0, 500), // Truncate for display
        parentId: events.length > 0 ? events[events.length - 1].id : undefined,
      });
      eventIndex++;
    } else if (message.role === 'assistant') {
      // Assistant can have multiple content blocks
      const blocks = typeof message.content === 'string' 
        ? [{ type: 'text' as const, text: message.content }]
        : message.content;
      
      let lastEventId = events.length > 0 ? events[events.length - 1].id : undefined;
      
      for (const block of blocks) {
        const blockTime = new Date(baseTime.getTime() + eventIndex * 1000);
        
        if (block.type === 'thinking' && block.thinking) {
          // Thinking block
          events.push({
            id: generateId(),
            timestamp: blockTime,
            type: 'thought',
            content: block.thinking.slice(0, 500),
            parentId: lastEventId,
          });
          lastEventId = events[events.length - 1].id;
          eventIndex++;
        } else if (block.type === 'text' && block.text) {
          // Regular text response
          events.push({
            id: generateId(),
            timestamp: blockTime,
            type: 'assistant_message',
            content: block.text.slice(0, 500),
            parentId: lastEventId,
          });
          lastEventId = events[events.length - 1].id;
          eventIndex++;
        } else if (block.type === 'tool_use' && block.name) {
          // Tool call
          const eventType = mapToolToEventType(block.name);
          const metadata: Record<string, unknown> = { tool: block.name };
          
          // Extract file path if present
          if (block.input) {
            if ('path' in block.input) metadata.file = block.input.path;
            if ('file_path' in block.input) metadata.file = block.input.file_path;
            if ('command' in block.input) metadata.command = block.input.command;
          }
          
          events.push({
            id: block.tool_use_id || generateId(),
            timestamp: blockTime,
            type: eventType,
            content: `Calling ${block.name}`,
            metadata,
            parentId: lastEventId,
          });
          lastEventId = events[events.length - 1].id;
          eventIndex++;
        } else if (block.type === 'tool_result') {
          // Tool result
          const content = typeof block.content === 'string' 
            ? block.content 
            : JSON.stringify(block.content);
          
          events.push({
            id: generateId(),
            timestamp: blockTime,
            type: 'tool_result',
            content: content.slice(0, 500),
            metadata: { 
              success: !content.toLowerCase().includes('error'),
            },
            parentId: block.tool_use_id || lastEventId,
          });
          lastEventId = events[events.length - 1].id;
          eventIndex++;
        }
      }
    }
  }
  
  return {
    id: data.sessionId || generateId(),
    name: 'Uploaded Session',
    description: `Clawdbot session with ${events.length} events`,
    agent: 'bubbi',
    startedAt: baseTime,
    events,
  };
}

export function isClawdbotFormat(data: unknown): data is ClawdbotSession {
  if (!data || typeof data !== 'object') return false;
  const obj = data as Record<string, unknown>;
  return Array.isArray(obj.messages);
}
