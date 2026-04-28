import { AgentSession, AgentEvent, AgentInfo, EventType } from '../types';

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
  // Common patterns across Claude Code tools.
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
    // Required + characteristic fields. sessionId+uuid is the strong signal;
    // type is always present on Claude Code records.
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

function parseJsonl(input: string | unknown[]): CCRecord[] {
  if (Array.isArray(input)) return input as CCRecord[];
  const out: CCRecord[] = [];
  for (const raw of input.split('\n')) {
    const line = raw.trim();
    if (!line) continue;
    try {
      out.push(JSON.parse(line) as CCRecord);
    } catch {
      // Tolerate truncated tail line without aborting.
    }
  }
  return out;
}

interface ToolUseSlot {
  uuid: string;          // synthetic uuid we minted for the spawn_agent event
  agentId: string;       // sub-agent id we assigned to the sidechain
  agentSpawned: boolean; // first sidechain record has been seen
}

export function parseClaudeCodeSession(input: string | unknown[]): AgentSession {
  const records = parseJsonl(input);

  // Pre-pass: index every record by uuid so we can climb parent chains across
  // records we deliberately skip (file-history snapshots, permission banners,
  // deferred-tools deltas). Without this, ~24% of events end up as roots in
  // the graph because their parent record was filtered out.
  const recordsByUuid = new Map<string, CCRecord>();
  for (const r of records) {
    if (r.uuid) recordsByUuid.set(r.uuid, r);
  }

  // Pre-pass: map record uuid -> assigned agentId.
  // The main thread is 'main'. Each Task tool_use that spawns a sidechain
  // gets its own agent id derived from the tool_use_id.
  const events: AgentEvent[] = [];
  const agents: AgentInfo[] = [
    { id: 'main', name: 'Claude Code', role: 'orchestrator' },
  ];
  const subAgentIds = new Set<string>();

  // Map tool_use_id -> ToolUseSlot for Task spawns so we can attribute
  // the matching sidechain records to the right swim-lane.
  const taskSlotByToolUseId = new Map<string, ToolUseSlot>();
  // Sidechain recordUuid -> agentId for fast lookup
  const sidechainParents = new Map<string, string>();

  let firstTimestamp: Date | null = null;
  let sessionId: string | undefined;
  const sidechainLastEventByAgent = new Map<string, string>();

  // record.uuid -> id of the last event we emitted for that record. Used to
  // rewrite future events' parentId (which references the parent record's uuid)
  // into a real, in-graph event id. Without this, suffixed ids like
  // `<uuid>::text` orphan their children in the React Flow graph.
  const recordToLastEventId = new Map<string, string>();
  let currentRecordUuid: string | undefined;

  // Resolve a parentUuid by walking up through skipped records.
  //
  // Three cases:
  //   1. The id maps to an emitted event (record uuid OR tool_use_id we
  //      registered) → return the mapped event id.
  //   2. The id is a known record we skipped → climb its parentUuid.
  //   3. The id is unknown to both maps → return as-is (it is most likely a
  //      direct event id like a tool_use_id pointing at a tool_call we have
  //      already emitted; the matching tool_result will still link).
  function resolveParent(parentUuid: string | undefined): string | undefined {
    if (!parentUuid) return undefined;
    let cursor: string | null | undefined = parentUuid;
    const seen = new Set<string>();
    while (cursor && !seen.has(cursor)) {
      seen.add(cursor);
      const mapped = recordToLastEventId.get(cursor);
      if (mapped) return mapped;
      const ancestor = recordsByUuid.get(cursor);
      if (!ancestor) return cursor; // unknown id — leave it for direct match
      cursor = ancestor.parentUuid ?? undefined;
    }
    return parentUuid;
  }

  function pushEvent(ev: AgentEvent) {
    ev.parentId = resolveParent(ev.parentId);
    events.push(ev);
    if (currentRecordUuid) recordToLastEventId.set(currentRecordUuid, ev.id);
    if (ev.agentId && ev.agentId !== 'main') {
      sidechainLastEventByAgent.set(ev.agentId, ev.id);
    }
  }

  function resolveAgentId(rec: CCRecord): string {
    if (!rec.isSidechain) return 'main';
    // Walk parentUuid chain to find a known sidechain root.
    let cursor: string | null | undefined = rec.parentUuid;
    while (cursor) {
      const found = sidechainParents.get(cursor);
      if (found) {
        if (rec.uuid) sidechainParents.set(rec.uuid, found);
        return found;
      }
      // Without the full record map we can't keep climbing — this works for
      // sequential records because the immediate parent is already mapped.
      cursor = null;
    }
    // Unrooted sidechain — fall back to a generic sidechain lane.
    const id = 'sidechain';
    if (!subAgentIds.has(id)) {
      subAgentIds.add(id);
      agents.push({ id, name: 'Sub-agent', role: 'researcher' });
    }
    if (rec.uuid) sidechainParents.set(rec.uuid, id);
    return id;
  }

  for (const rec of records) {
    if (!sessionId && rec.sessionId) sessionId = rec.sessionId;
    const ts = rec.timestamp ? new Date(rec.timestamp) : new Date();
    if (!firstTimestamp) firstTimestamp = ts;
    const agentId = resolveAgentId(rec);
    const parentId = rec.parentUuid || undefined;
    currentRecordUuid = rec.uuid;

    switch (rec.type) {
      case 'user': {
        const msg = (rec as CCMessageRecord).message;
        if (!msg) break;
        // Plain string content = real user prompt.
        if (typeof msg.content === 'string') {
          pushEvent({
            id: rec.uuid || newId(),
            timestamp: ts,
            type: 'user_message',
            content: clamp(msg.content),
            parentId,
            agentId,
          });
          break;
        }
        // Array content under role:user is how Claude Code delivers tool_result blocks.
        for (const block of msg.content) {
          if (block.type === 'tool_result') {
            const text = flattenToolResultContent(block);
            pushEvent({
              id: `${rec.uuid || newId()}::${block.tool_use_id}`,
              timestamp: ts,
              type: 'tool_result',
              content: clamp(text),
              metadata: { success: !block.is_error },
              parentId: block.tool_use_id || parentId,
              agentId,
            });
          } else if (block.type === 'text' && block.text) {
            pushEvent({
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
            pushEvent({
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
            pushEvent({
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
            // Spawn a sub-agent on Task calls.
            if (isTask && !rec.isSidechain) {
              const subId = `agent_${block.id.slice(-6)}`;
              const subType =
                (block.input?.subagent_type as string | undefined) || 'sub-agent';
              const subDesc =
                (block.input?.description as string | undefined) || subType;
              if (!subAgentIds.has(subId)) {
                subAgentIds.add(subId);
                agents.push({
                  id: subId,
                  name: subDesc,
                  role: subType,
                  parentAgentId: 'main',
                });
              }
              const spawnId = `${block.id}::spawn`;
              pushEvent({
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
              taskSlotByToolUseId.set(block.id, {
                uuid: spawnId,
                agentId: subId,
                agentSpawned: false,
              });
              // Seed sidechain parent map: subsequent sidechain records whose
              // chain eventually traces back here will be attributed to subId.
              sidechainParents.set(block.id, subId);
              if (rec.uuid) sidechainParents.set(rec.uuid, subId);
              // Make `parentUuid: <toolUseId>` resolve to the spawn event id.
              recordToLastEventId.set(block.id, spawnId);
              lastInTurn = spawnId;
            } else {
              const evType = toolToEventType(block.name);
              const evId = block.id || newId();
              const meta: Record<string, unknown> = { tool: block.name };
              const inp = block.input || {};
              if (typeof inp.file_path === 'string') meta.file = inp.file_path;
              else if (typeof inp.path === 'string') meta.file = inp.path;
              if (typeof inp.command === 'string') meta.command = inp.command;
              pushEvent({
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
        // Most attachments are noise (file-history snapshots, deferred-tools deltas).
        // Surface only hook results — they are user-visible and meaningful.
        const att = (rec as CCAttachmentRecord).attachment;
        if (!att) break;
        const isHook = att.type === 'hook_success' || att.type === 'hook_failure';
        if (!isHook) break;
        const ok = att.type === 'hook_success' && (att.exitCode ?? 0) === 0;
        pushEvent({
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
        pushEvent({
          id: rec.uuid || newId(),
          timestamp: ts,
          type: 'decision',
          content: clamp(`Summary: ${sumRec.summary}`),
          parentId,
          agentId,
        });
        break;
      }

      // Skip noisy / structural records: permission-mode, file-history-snapshot,
      // system meta. Anything unknown also falls through silently.
      default:
        break;
    }
  }

  // Emit agent_complete for each sub-agent at the position of its last event.
  for (const [subId, lastEvId] of sidechainLastEventByAgent.entries()) {
    const lastIdx = events.findIndex((e) => e.id === lastEvId);
    if (lastIdx < 0) continue;
    const last = events[lastIdx];
    events.splice(lastIdx + 1, 0, {
      id: `${subId}::complete`,
      timestamp: last.timestamp,
      type: 'agent_complete',
      content: `${agents.find((a) => a.id === subId)?.name || subId} finished`,
      parentId: last.id,
      agentId: subId,
    });
  }

  const isMultiAgent = subAgentIds.size > 0;

  return {
    id: sessionId || newId(),
    name: 'Claude Code Session',
    description: `${events.length} events${
      isMultiAgent ? ` · ${subAgentIds.size} sub-agent(s)` : ''
    }`,
    agent: 'claude',
    startedAt: firstTimestamp || new Date(),
    events,
    agents: isMultiAgent ? agents : undefined,
    isMultiAgent: isMultiAgent || undefined,
  };
}
