import { AgentSession } from '../types';
import { parseClawdbotSession, isClawdbotFormat } from './clawdbot';

export type ParseResult = 
  | { success: true; session: AgentSession }
  | { success: false; error: string };

/**
 * Auto-detect format and parse session data
 */
export function parseSessionData(data: unknown): ParseResult {
  // Try Clawdbot format
  if (isClawdbotFormat(data)) {
    try {
      const session = parseClawdbotSession(data);
      return { success: true, session };
    } catch (e) {
      return { 
        success: false, 
        error: `Failed to parse Clawdbot format: ${e instanceof Error ? e.message : 'Unknown error'}` 
      };
    }
  }
  
  // TODO: Add LangChain parser
  // TODO: Add generic JSONL parser
  
  return { 
    success: false, 
    error: 'Unrecognized session format. Supported formats: Clawdbot, LangChain (coming soon)' 
  };
}

/**
 * Parse JSON string into session
 */
export function parseSessionJson(jsonString: string): ParseResult {
  try {
    const data = JSON.parse(jsonString);
    return parseSessionData(data);
  } catch (e) {
    return { 
      success: false, 
      error: `Invalid JSON: ${e instanceof Error ? e.message : 'Parse error'}` 
    };
  }
}
