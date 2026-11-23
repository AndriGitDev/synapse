import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { syncBuiltinESMExports } from 'node:module';
import { test } from 'node:test';
import { JsonlTail } from './claude-code-bridge.mts';

function fixture(t: { after: (fn: () => void) => void }): string {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'synapse-tail-'));
  t.after(() => fs.rmSync(dir, { recursive: true, force: true }));
  return path.join(dir, 'session.jsonl');
}

test('appends and partial records are read exactly once', (t) => {
  const file = fixture(t);
  fs.writeFileSync(file, '{"id":1}\n{"id":');
  const tail = new JsonlTail(file);
  assert.deepEqual(tail.readNew(), [{ id: 1 }]);
  assert.deepEqual(tail.readNew(), []);
  fs.appendFileSync(file, '2}\n');
  assert.deepEqual(tail.readNew(), [{ id: 2 }]);
  assert.deepEqual(tail.readNew(), []);
});

test('replacement by a larger file restarts at the new inode', (t) => {
  const file = fixture(t);
  fs.writeFileSync(file, '{"id":1}\n');
  const tail = new JsonlTail(file);
  assert.deepEqual(tail.readNew(), [{ id: 1 }]);
  fs.writeFileSync(file + '.next', '{"id":20000}\n{"id":30000}\n');
  fs.renameSync(file + '.next', file);
  assert.deepEqual(tail.readNew(), [{ id: 20000 }, { id: 30000 }]);
});

test('metadata comes from the opened descriptor, not the pathname', (t) => {
  const file = fixture(t);
  fs.writeFileSync(file, '{"id":1}\n');
  t.mock.method(fs, 'statSync', () => { throw Error('path stat is stale'); });
  syncBuiltinESMExports();
  t.after(() => { t.mock.restoreAll(); syncBuiltinESMExports(); });
  assert.deepEqual(new JsonlTail(file).readNew(), [{ id: 1 }]);
});

test('short reads advance by bytes read and preserve the partial record', (t) => {
  const file = fixture(t);
  fs.writeFileSync(file, '{"text":"Þór😀"}\n');
  const originalRead = fs.readSync;
  t.mock.method(fs, 'readSync', (fd: number, buffer: Uint8Array, offset: number,
    length: number, position: number | null) => originalRead(fd, buffer, offset, Math.min(length, 5), position));
  syncBuiltinESMExports();
  t.after(() => { t.mock.restoreAll(); syncBuiltinESMExports(); });
  const tail = new JsonlTail(file);
  const records: unknown[] = [];
  for (let n = 0; n < 5; n++) records.push(...tail.readNew());
  assert.deepEqual(records, [{ text: 'Þór😀' }]);
  assert.deepEqual(tail.readNew(), []);
});

test('truncation drops a stale partial record', (t) => {
  const file = fixture(t);
  fs.writeFileSync(file, '{"text":"old');
  const tail = new JsonlTail(file);
  assert.deepEqual(tail.readNew(), []);
  fs.truncateSync(file, 0);
  assert.deepEqual(tail.readNew(), []);
  fs.writeFileSync(file, '{"text":"new"}\n');
  assert.deepEqual(tail.readNew(), [{ text: 'new' }]);
});

test('symlinks are refused without reading their target', { skip: !fs.constants.O_NOFOLLOW }, (t) => {
  const file = fixture(t);
  fs.writeFileSync(file + '.target', '{"private":"synthetic"}\n');
  fs.symlinkSync(file + '.target', file);
  assert.deepEqual(new JsonlTail(file).readNew(), []);
});

test('a directory is refused as a session file', (t) => {
  const file = fixture(t);
  fs.mkdirSync(file);
  assert.deepEqual(new JsonlTail(file).readNew(), []);
});
