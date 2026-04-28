#!/usr/bin/env node --experimental-strip-types
/**
 * 🌉 SYNAPSE ↔ Claude Code Bridge
 *
 * Tails a Claude Code session JSONL file (~/.claude/projects/<slug>/<sid>.jsonl)
 * and streams every appended record through the shared parser, broadcasting
 * the resulting AgentEvents over WebSocket so SYNAPSE Live mode can render
 * the session in real time.
 *
 * Usage:
 *   # Watch the most-recently-modified session across all projects:
 *   node --experimental-strip-types scripts/claude-code-bridge.ts
 *
 *   # Watch a specific session file:
 *   node --experimental-strip-types scripts/claude-code-bridge.ts --file <path>
 *
 *   # Then connect SYNAPSE → Live Mode → ws://localhost:8080/synapse
 */

import { WebSocketServer } from 'ws';
import * as fs from 'node:fs';
import * as path from 'node:path';
import * as os from 'node:os';
import { ClaudeCodeStreamParser, parseClaudeCodeJsonl } from '../src/lib/parsers/claude-code.mts';
import type { AgentEvent } from '../src/lib/types';

interface CliOptions {
  file?: string;
  port: number;
  host: string;
}

function parseArgs(argv: string[]): CliOptions {
  const opts: CliOptions = {
    port: Number(process.env.SYNAPSE_PORT) || 8080,
    host: process.env.SYNAPSE_HOST || '127.0.0.1',
  };
  for (let i = 2; i < argv.length; i++) {
    const a = argv[i];
    if (a === '--file' || a === '-f') opts.file = argv[++i];
    else if (a === '--port' || a === '-p') opts.port = Number(argv[++i]);
    else if (a === '--host' || a === '-h') opts.host = argv[++i];
    else if (a === '--help') {
      console.log(
        'Usage: claude-code-bridge [--file <path>] [--port 8080] [--host 127.0.0.1]'
      );
      process.exit(0);
    }
  }
  return opts;
}

function findLatestSessionFile(): string | null {
  const root = path.join(os.homedir(), '.claude', 'projects');
  if (!fs.existsSync(root)) return null;
  let best: { path: string; mtime: number } | null = null;
  for (const slug of fs.readdirSync(root)) {
    const dir = path.join(root, slug);
    let stat: fs.Stats;
    try {
      stat = fs.statSync(dir);
    } catch {
      continue;
    }
    if (!stat.isDirectory()) continue;
    for (const f of fs.readdirSync(dir)) {
      if (!f.endsWith('.jsonl')) continue;
      const full = path.join(dir, f);
      try {
        const s = fs.statSync(full);
        if (!best || s.mtimeMs > best.mtime) best = { path: full, mtime: s.mtimeMs };
      } catch {
        // skip unreadable
      }
    }
  }
  return best?.path ?? null;
}

/**
 * Tail a JSONL file by byte offset. We hold the offset across reads so each
 * tick only processes appended bytes. A trailing partial line (file flushed
 * mid-record) is preserved in `partial` and prepended to the next read.
 */
class JsonlTail {
  private offset = 0;
  private partial = '';
  private readonly file: string;

  constructor(file: string) {
    this.file = file;
  }

  /** Read everything appended since the last call; returns parsed records. */
  readNew(): unknown[] {
    let stat: fs.Stats;
    try {
      stat = fs.statSync(this.file);
    } catch {
      return [];
    }
    // File shrunk (replaced/truncated) — restart from zero.
    if (stat.size < this.offset) {
      this.offset = 0;
      this.partial = '';
    }
    if (stat.size === this.offset) return [];
    const fd = fs.openSync(this.file, 'r');
    try {
      const length = stat.size - this.offset;
      const buf = Buffer.alloc(length);
      fs.readSync(fd, buf, 0, length, this.offset);
      this.offset = stat.size;
      const text = this.partial + buf.toString('utf8');
      const lastNl = text.lastIndexOf('\n');
      if (lastNl < 0) {
        this.partial = text;
        return [];
      }
      this.partial = text.slice(lastNl + 1);
      const complete = text.slice(0, lastNl);
      return parseClaudeCodeJsonl(complete);
    } finally {
      fs.closeSync(fd);
    }
  }
}

function main(): void {
  const opts = parseArgs(process.argv);
  const file = opts.file ?? findLatestSessionFile();
  if (!file) {
    console.error('No Claude Code session file found. Pass --file <path>.');
    process.exit(1);
  }
  if (!fs.existsSync(file)) {
    console.error(`Session file does not exist: ${file}`);
    process.exit(1);
  }

  console.error(`📂 Watching: ${file}`);
  console.error(`🔌 ws://${opts.host}:${opts.port}/synapse`);

  const parser = new ClaudeCodeStreamParser();
  const tail = new JsonlTail(file);
  const buffered: AgentEvent[] = [];
  let sessionStarted = false;

  const wss = new WebSocketServer({ host: opts.host, port: opts.port, path: '/synapse' });
  const clients = new Set<import('ws').WebSocket>();

  function broadcast(message: unknown): void {
    const data = JSON.stringify(message);
    for (const c of clients) {
      if (c.readyState === c.OPEN) c.send(data);
    }
  }

  function snapshotSessionStart(): unknown {
    const s = parser.getSession();
    return {
      type: 'session_start',
      session: {
        id: s.id,
        name: `Claude Code: ${path.basename(file!, '.jsonl')}`,
        agent: 'claude',
        agents: s.agents,
        isMultiAgent: s.isMultiAgent,
      },
    };
  }

  wss.on('connection', (ws) => {
    clients.add(ws);
    console.error(`✅ client connected (${clients.size})`);
    if (sessionStarted) {
      ws.send(JSON.stringify(snapshotSessionStart()));
      for (const ev of buffered) ws.send(JSON.stringify({ type: 'event', event: ev }));
    }
    ws.on('close', () => {
      clients.delete(ws);
      console.error(`❌ client disconnected (${clients.size})`);
    });
    ws.on('error', () => {
      clients.delete(ws);
    });
  });

  function tick(): void {
    const records = tail.readNew();
    if (!records.length) return;
    const newEvents: AgentEvent[] = [];
    for (const rec of records) newEvents.push(...parser.consume(rec as never));
    if (!newEvents.length) return;

    if (!sessionStarted) {
      sessionStarted = true;
      broadcast(snapshotSessionStart());
    }
    for (const ev of newEvents) {
      buffered.push(ev);
      broadcast({ type: 'event', event: ev });
    }
    console.error(
      `→ +${newEvents.length} event(s) (total ${buffered.length})`
    );
  }

  // Initial backfill — read whatever is in the file now.
  tick();

  // fs.watch fires on every flush by Claude Code. We rate-limit with a
  // setImmediate trampoline so back-to-back writes coalesce into one tick.
  let pending = false;
  const watcher = fs.watch(file, { persistent: true }, () => {
    if (pending) return;
    pending = true;
    setImmediate(() => {
      pending = false;
      tick();
    });
  });

  // Some filesystems lose fs.watch events under load — poll as a backstop.
  const pollMs = Number(process.env.SYNAPSE_POLL_MS) || 1000;
  const pollTimer = setInterval(tick, pollMs);

  function shutdown(): void {
    console.error('\nshutting down…');
    clearInterval(pollTimer);
    watcher.close();
    for (const c of clients) c.close();
    wss.close(() => process.exit(0));
  }
  process.on('SIGINT', shutdown);
  process.on('SIGTERM', shutdown);
}

main();
