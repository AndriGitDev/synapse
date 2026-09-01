import { AgentSession } from '../types';
import { parseClawdbotSession, isClawdbotFormat } from './clawdbot';
import { parseClaudeCodeSession, isClaudeCodeFormat } from './claude-code';

export type ParseResult =
  | { success: true; session: AgentSession }
  | { success: false; error: string };

/**
 * Auto-detect format and parse session data.
 *
 * Accepts:
 *   - Claude Code: array of JSONL records (or a single record)
 *   - Clawdbot:    { messages: [...] }
 */
export function parseSessionData(data: unknown): ParseResult {
  if (isClaudeCodeFormat(data)) {
    try {
      const session = parseClaudeCodeSession(
        Array.isArray(data) ? data : [data]
      );
      return { success: true, session };
    } catch (e) {
      return {
        success: false,
        error: `Failed to parse Claude Code format: ${
          e instanceof Error ? e.message : 'Unknown error'
        }`,
      };
    }
  }

  if (isClawdbotFormat(data)) {
    try {
      const session = parseClawdbotSession(data);
      return { success: true, session };
    } catch (e) {
      return {
        success: false,
        error: `Failed to parse Clawdbot format: ${
          e instanceof Error ? e.message : 'Unknown error'
        }`,
      };
    }
  }

  return {
    success: false,
    error:
      'Unrecognized session format. Supported: Claude Code (JSONL), Clawdbot.',
  };
}

/**
 * Parse a session from a string. Detects whether the payload is JSONL
 * (Claude Code) or a single JSON object (Clawdbot) and dispatches.
 */
export function parseSessionJson(text: string): ParseResult {
  const trimmed = text.trim();

  // JSONL fast path: multiple lines, each parseable as JSON, looks like
  // Claude Code records.
  if (trimmed.includes('\n') && isClaudeCodeFormat(trimmed)) {
    try {
      const session = parseClaudeCodeSession(trimmed);
      return { success: true, session };
    } catch (e) {
      return {
        success: false,
        error: `Failed to parse Claude Code JSONL: ${
          e instanceof Error ? e.message : 'Unknown error'
        }`,
      };
    }
  }

  try {
    const data = JSON.parse(trimmed);
    return parseSessionData(data);
  } catch (e) {
    return {
      success: false,
      error: `Invalid JSON: ${e instanceof Error ? e.message : 'Parse error'}`,
    };
  }
}
