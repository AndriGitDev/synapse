import type { AgentSession, AgentEvent, AgentInfo, EventType } from '../types';

/**
 * Parse a Claude Code session (JSONL on disk at
 * ~/.claude/projects/<slug>/<sessionId>.jsonl).
 *
 * Each line is one JSON record discriminated by a top-level `type`:
 *   - "user"                  message from the operator OR tool_result blocks
 *   - "assistant"             model turn (text / thinking / tool_use blocks)
 *   - "system"                CLI system messages
 *   - "summary"               post-hoc compaction summary
 *   - "attachment"            hook output, deferred-tools delta, etc.
 *   - "permission-mode"       mode banner
 *   - "file-history-snapshot" Edit tool tracking metadata
 *
 * Records carry `uuid` and `parentUuid`, giving us the real conversation DAG
 * for free — we forward that directly into AgentEvent.parentId rather than
 * faking parent links by linear order like the Clawdbot parser does.
 *
 * Sidechains (`isSidechain: true`) come from the Task tool spawning a
 * sub-agent. We surface those as Synapse spawn_agent / agent_complete events
 * and assign each sidechain its own swim lane via AgentEvent.agentId.
 *
 * The implementation is exposed as a stateful class (ClaudeCodeStreamParser)
 * so live mode can feed records incrementally as they are appended to the
 * session file. parseClaudeCodeSession is a thin batch wrapper.
 */

type CCContentBlock =
  | { type: 'text'; text: string }
  | { type: 'thinking'; thinking: string; signature?: string }
  | { type: 'tool_use'; id: string; name: string; input?: Record<string, unknown> }
  | {
      type: 'tool_result';
      tool_use_id: string;
      content: string | Array<{ type: string; text?: string }>;
      is_error?: boolean;
    };

interface CCMessageEnvelope {
  role: 'user' | 'assistant';
  content: string | CCContentBlock[];
  model?: string;
}

interface CCRecordBase {
  uuid?: string;
  parentUuid?: string | null;
  timestamp?: string;
  sessionId?: string;
  isSidechain?: boolean;
  cwd?: string;
  gitBranch?: string;
  version?: string;
}

interface CCMessageRecord extends CCRecordBase {
  type: 'user' | 'assistant';
  message: CCMessageEnvelope;
}

interface CCSummaryRecord extends CCRecordBase {
  type: 'summary';
  summary: string;
  leafUuid?: string;
}

interface CCAttachmentRecord extends CCRecordBase {
  type: 'attachment';
  attachment: {
    type: string;
    hookName?: string;
    hookEvent?: string;
    content?: string;
    stdout?: string;
    stderr?: string;
    exitCode?: number;
    [key: string]: unknown;
  };
}

interface CCSystemRecord extends CCRecordBase {
  type: 'system';
  content?: string;
  text?: string;
  isMeta?: boolean;
}

type CCRecord =
  | CCMessageRecord
  | CCSummaryRecord
  | CCAttachmentRecord
  | CCSystemRecord
  | (CCRecordBase & { type: string; [key: string]: unknown });

const MAX_CONTENT = 500;

function clamp(s: string): string {
  if (!s) return '';
  return s.length > MAX_CONTENT ? s.slice(0, MAX_CONTENT) + '…' : s;
}

function newId(): string {
  return `cc_${Math.random().toString(36).slice(2, 11)}`;
}

const FILE_READ_TOOLS = new Set(['Read', 'NotebookRead']);
const FILE_WRITE_TOOLS = new Set(['Write', 'Edit', 'NotebookEdit', 'MultiEdit']);

function toolToEventType(name: string): EventType {
  if (FILE_READ_TOOLS.has(name)) return 'file_read';
  if (FILE_WRITE_TOOLS.has(name)) return 'file_write';
  return 'tool_call';
}

function describeToolInput(name: string, input?: Record<string, unknown>): string {
  if (!input) return `Calling ${name}`;
  const path =
    (input.file_path as string | undefined) ||
    (input.path as string | undefined) ||
    (input.notebook_path as string | undefined);
  if (path) return `${name} ${path}`;
  if (typeof input.command === 'string') return `${name}: ${input.command}`;
  if (typeof input.pattern === 'string') return `${name} /${input.pattern}/`;
  if (typeof input.url === 'string') return `${name} ${input.url}`;
  if (typeof input.description === 'string') return `${name}: ${input.description}`;
  return `Calling ${name}`;
}

function flattenToolResultContent(
  content: CCContentBlock & { type: 'tool_result' }
): string {
  if (typeof content.content === 'string') return content.content;
  return content.content
    .map((b) => (b.type === 'text' && b.text ? b.text : ''))
    .filter(Boolean)
    .join('\n');
}

/** Heuristic detector — accepts a single record, an array, or a JSONL string. */
export function isClaudeCodeFormat(data: unknown): boolean {
  const probe = (rec: unknown): boolean => {
    if (!rec || typeof rec !== 'object') return false;
    const r = rec as Record<string, unknown>;
    return (
      typeof r.type === 'string' &&
      (typeof r.sessionId === 'string' || typeof r.uuid === 'string')
    );
  };
  if (Array.isArray(data)) return data.length > 0 && probe(data[0]);
  if (typeof data === 'string') {
    const firstLine = data.split('\n').find((l) => l.trim().length > 0);
    if (!firstLine) return false;
    try {
      return probe(JSON.parse(firstLine));
    } catch {
      return false;
    }
  }
  return probe(data);
}

/**
 * Parse a JSONL string (or pass through an array of records) into CCRecord[].
 * Tolerates a truncated trailing line — common when reading a session file
 * that is being actively appended to.
 */
export function parseClaudeCodeJsonl(input: string | unknown[]): CCRecord[] {
  if (Array.isArray(input)) return input as CCRecord[];
  const out: CCRecord[] = [];
  for (const raw of input.split('\n')) {
    const line = raw.trim();
    if (!line) continue;
    try {
      out.push(JSON.parse(line) as CCRecord);
    } catch {
      // truncated tail — drop and continue
    }
  }
  return out;
}

/**
 * Stateful incremental parser. Feed it records (or raw JSONL chunks) and it
 * emits the corresponding AgentEvents in order. Internal state — uuid maps,
 * sub-agent registry, sidechain attribution — persists across calls so the
 * live bridge can stream events as they are appended to the session file.
 */
export class ClaudeCodeStreamParser {
  private events: AgentEvent[] = [];
  private agents: AgentInfo[] = [
    { id: 'main', name: 'Claude Code', role: 'orchestrator' },
  ];
  private subAgentIds = new Set<string>();
  private recordsByUuid = new Map<string, CCRecord>();
  // record uuid OR tool_use id -> last event id we emitted for it. Used to
  // rewrite future events' parentId into a real, in-graph event id.
  private recordToLastEventId = new Map<string, string>();
  // sidechain record uuid -> sub-agent id, threaded forward as we process
  // the chain so children are attributed to the right swim lane.
  private sidechainParents = new Map<string, string>();
  // Spawn metadata indexed by Task tool_use id, so we know which sub-agent
  // to mark complete when the matching tool_result lands on main.
  private taskSlotByToolUseId = new Map<string, { agentId: string; spawnEventId: string }>();
  private completedAgents = new Set<string>();
  private firstTimestamp: Date | null = null;
  private sessionId: string | undefined;
  private currentRecordUuid: string | undefined;

  private resolveParent(parentUuid: string | undefined): string | undefined {
    if (!parentUuid) return undefined;
    let cursor: string | null | undefined = parentUuid;
    const seen = new Set<string>();
    while (cursor && !seen.has(cursor)) {
      seen.add(cursor);
      const mapped = this.recordToLastEventId.get(cursor);
      if (mapped) return mapped;
      const ancestor = this.recordsByUuid.get(cursor);
      if (!ancestor) return cursor; // unknown id — leave for direct match
      cursor = ancestor.parentUuid ?? undefined;
    }
    return parentUuid;
  }

  private push(events: AgentEvent[], ev: AgentEvent): void {
    ev.parentId = this.resolveParent(ev.parentId);
    this.events.push(ev);
    events.push(ev);
    if (this.currentRecordUuid) {
      this.recordToLastEventId.set(this.currentRecordUuid, ev.id);
    }
  }

  private resolveAgentId(rec: CCRecord): string {
    if (!rec.isSidechain) return 'main';
    let cursor: string | null | undefined = rec.parentUuid;
    while (cursor) {
      const found = this.sidechainParents.get(cursor);
      if (found) {
        if (rec.uuid) this.sidechainParents.set(rec.uuid, found);
        return found;
      }
      cursor = null;
    }
    // Unrooted sidechain — fallback lane.
    const id = 'sidechain';
    if (!this.subAgentIds.has(id)) {
      this.subAgentIds.add(id);
      this.agents.push({ id, name: 'Sub-agent', role: 'researcher' });
    }
    if (rec.uuid) this.sidechainParents.set(rec.uuid, id);
    return id;
  }

  /** Process one record, return the events it produced (in order). */
  consume(rec: CCRecord): AgentEvent[] {
    const emitted: AgentEvent[] = [];
    if (rec.uuid) this.recordsByUuid.set(rec.uuid, rec);
    if (!this.sessionId && rec.sessionId) this.sessionId = rec.sessionId;
    const ts = rec.timestamp ? new Date(rec.timestamp) : new Date();
    if (!this.firstTimestamp) this.firstTimestamp = ts;
    const agentId = this.resolveAgentId(rec);
    const parentId = rec.parentUuid || undefined;
    this.currentRecordUuid = rec.uuid;

    switch (rec.type) {
      case 'user': {
        const msg = (rec as CCMessageRecord).message;
        if (!msg) break;
        if (typeof msg.content === 'string') {
          this.push(emitted, {
            id: rec.uuid || newId(),
            timestamp: ts,
            type: 'user_message',
            content: clamp(msg.content),
            parentId,
            agentId,
          });
          break;
        }
        for (const block of msg.content) {
          if (block.type === 'tool_result') {
            const text = flattenToolResultContent(block);
            this.push(emitted, {
              id: `${rec.uuid || newId()}::${block.tool_use_id}`,
              timestamp: ts,
              type: 'tool_result',
              content: clamp(text),
              metadata: { success: !block.is_error },
              parentId: block.tool_use_id || parentId,
              agentId,
            });
            // If this tool_result is the return value of a Task call, mark
            // the spawned sub-agent complete on its lane right now.
            const slot = this.taskSlotByToolUseId.get(block.tool_use_id);
            if (slot && !this.completedAgents.has(slot.agentId)) {
              this.completedAgents.add(slot.agentId);
              const subAgent = this.agents.find((a) => a.id === slot.agentId);
              this.push(emitted, {
                id: `${slot.agentId}::complete`,
                timestamp: ts,
                type: 'agent_complete',
                content: `${subAgent?.name || slot.agentId} finished`,
                parentId: slot.spawnEventId,
                agentId: slot.agentId,
              });
            }
          } else if (block.type === 'text' && block.text) {
            this.push(emitted, {
              id: rec.uuid || newId(),
              timestamp: ts,
              type: 'user_message',
              content: clamp(block.text),
              parentId,
              agentId,
            });
          }
        }
        break;
      }

      case 'assistant': {
        const msg = (rec as CCMessageRecord).message;
        if (!msg || typeof msg.content === 'string') break;
        let lastInTurn = parentId;
        for (const block of msg.content) {
          if (block.type === 'thinking' && block.thinking) {
            const evId = `${rec.uuid || newId()}::think`;
            this.push(emitted, {
              id: evId,
              timestamp: ts,
              type: 'thought',
              content: clamp(block.thinking),
              parentId: lastInTurn,
              agentId,
            });
            lastInTurn = evId;
          } else if (block.type === 'text' && block.text) {
            const evId = `${rec.uuid || newId()}::text`;
            this.push(emitted, {
              id: evId,
              timestamp: ts,
              type: 'assistant_message',
              content: clamp(block.text),
              parentId: lastInTurn,
              agentId,
            });
            lastInTurn = evId;
          } else if (block.type === 'tool_use') {
            const isTask = block.name === 'Task';
            if (isTask && !rec.isSidechain) {
              const subId = `agent_${block.id.slice(-6)}`;
              const subType =
                (block.input?.subagent_type as string | undefined) || 'sub-agent';
              const subDesc =
                (block.input?.description as string | undefined) || subType;
              if (!this.subAgentIds.has(subId)) {
                this.subAgentIds.add(subId);
                this.agents.push({
                  id: subId,
                  name: subDesc,
                  role: subType,
                  parentAgentId: 'main',
                });
              }
              const spawnId = `${block.id}::spawn`;
              this.push(emitted, {
                id: spawnId,
                timestamp: ts,
                type: 'spawn_agent',
                content: `Spawning ${subType}: ${subDesc}`,
                parentId: lastInTurn,
                agentId: 'main',
                metadata: {
                  tool: 'Task',
                  spawnedAgent: { id: subId, name: subDesc, role: subType },
                },
              });
              this.taskSlotByToolUseId.set(block.id, {
                agentId: subId,
                spawnEventId: spawnId,
              });
              this.sidechainParents.set(block.id, subId);
              if (rec.uuid) this.sidechainParents.set(rec.uuid, subId);
              this.recordToLastEventId.set(block.id, spawnId);
              lastInTurn = spawnId;
            } else {
              const evType = toolToEventType(block.name);
              const evId = block.id || newId();
              const meta: Record<string, unknown> = { tool: block.name };
              const inp = block.input || {};
              if (typeof inp.file_path === 'string') meta.file = inp.file_path;
              else if (typeof inp.path === 'string') meta.file = inp.path;
              if (typeof inp.command === 'string') meta.command = inp.command;
              this.push(emitted, {
                id: evId,
                timestamp: ts,
                type: evType,
                content: clamp(describeToolInput(block.name, inp)),
                parentId: lastInTurn,
                agentId,
                metadata: meta,
              });
              lastInTurn = evId;
            }
          }
        }
        break;
      }

      case 'attachment': {
        const att = (rec as CCAttachmentRecord).attachment;
        if (!att) break;
        const isHook = att.type === 'hook_success' || att.type === 'hook_failure';
        if (!isHook) break;
        const ok = att.type === 'hook_success' && (att.exitCode ?? 0) === 0;
        this.push(emitted, {
          id: rec.uuid || newId(),
          timestamp: ts,
          type: ok ? 'tool_result' : 'error',
          content: clamp(att.content || att.stdout || att.stderr || att.hookName || ''),
          parentId,
          agentId,
          metadata: { tool: `hook:${att.hookName || att.hookEvent || ''}`, success: ok },
        });
        break;
      }

      case 'summary': {
        const sumRec = rec as CCSummaryRecord;
        if (!sumRec.summary) break;
        this.push(emitted, {
          id: rec.uuid || newId(),
          timestamp: ts,
          type: 'decision',
          content: clamp(`Summary: ${sumRec.summary}`),
          parentId,
          agentId,
        });
        break;
      }

      // permission-mode, file-history-snapshot, system meta — silently skipped.
      default:
        break;
    }
    return emitted;
  }

  /** Process many records (or a JSONL string). Returns events emitted in order. */
  consumeMany(input: string | unknown[]): AgentEvent[] {
    const records = parseClaudeCodeJsonl(input);
    const all: AgentEvent[] = [];
    for (const rec of records) all.push(...this.consume(rec));
    return all;
  }

  /**
   * Emit agent_complete for any sub-agent whose Task tool_result never landed
   * (session ended mid-flight). Call when the input stream is finalised.
   */
  finalize(): AgentEvent[] {
    const emitted: AgentEvent[] = [];
    this.currentRecordUuid = undefined;
    for (const [, slot] of this.taskSlotByToolUseId) {
      if (this.completedAgents.has(slot.agentId)) continue;
      this.completedAgents.add(slot.agentId);
      const last = [...this.events].reverse().find((e) => e.agentId === slot.agentId);
      const parentId = last?.id || slot.spawnEventId;
      const subAgent = this.agents.find((a) => a.id === slot.agentId);
      const ev: AgentEvent = {
        id: `${slot.agentId}::complete`,
        timestamp: last?.timestamp || new Date(),
        type: 'agent_complete',
        content: `${subAgent?.name || slot.agentId} finished`,
        parentId,
        agentId: slot.agentId,
      };
      this.events.push(ev);
      emitted.push(ev);
    }
    return emitted;
  }

  /** Snapshot the session as currently consumed. */
  getSession(): AgentSession {
    const isMultiAgent = this.subAgentIds.size > 0;
    return {
      id: this.sessionId || newId(),
      name: 'Claude Code Session',
      description: `${this.events.length} events${
        isMultiAgent ? ` · ${this.subAgentIds.size} sub-agent(s)` : ''
      }`,
      agent: 'claude',
      startedAt: this.firstTimestamp || new Date(),
      events: this.events.slice(),
      agents: isMultiAgent ? this.agents.slice() : undefined,
      isMultiAgent: isMultiAgent || undefined,
    };
  }
}

/** Batch entrypoint — equivalent to feeding everything to a fresh stream parser. */
export function parseClaudeCodeSession(input: string | unknown[]): AgentSession {
  const parser = new ClaudeCodeStreamParser();
  parser.consumeMany(input);
  parser.finalize();
  return parser.getSession();
}
