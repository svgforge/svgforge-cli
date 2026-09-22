import assert from 'node:assert/strict';
import process from 'node:process';
import {describe, it} from 'node:test';
import {createProgressBar} from '../lib/progress.js';

describe('createProgressBar', () => {
  it('writes an animated progress bar on interactive terminals', () => {
    const listeners = {};
    const spriter = {
      on(event, fn) {
        listeners[event] = fn;
      },
      off(event) {
        delete listeners[event];
      },
    };
    const chunks = [];
    const originalIsTTY = process.stderr.isTTY;
    const originalWrite = process.stderr.write;

    process.stderr.isTTY = true;
    process.stderr.write = chunk => {
      chunks.push(String(chunk));
      return true;
    };

    const bar = createProgressBar(spriter);
    bar.refreshTotal(4);
    listeners.progress({processed: 1, total: 4});
    listeners.progress({processed: 2, total: 4});
    listeners.progress({processed: 4, total: 4});
    bar.finish();

    process.stderr.isTTY = originalIsTTY;
    process.stderr.write = originalWrite;

    const rendered = chunks.join('');
    assert.match(rendered, /^\r\[/u);
    assert.match(rendered, /1\/4/u);
    assert.match(rendered, /4\/4/u);
    assert.match(rendered, /100\.0%\)/u);
    assert.ok(rendered.endsWith('\n'));
  });

  it('writes one line per step when not on a TTY', () => {
    const listeners = {};
    const spriter = {
      on(event, fn) {
        listeners[event] = fn;
      },
      off(event) {
        delete listeners[event];
      },
    };
    const chunks = [];
    const originalIsTTY = process.stderr.isTTY;
    const originalWrite = process.stderr.write;

    process.stderr.isTTY = false;
    process.stderr.write = chunk => {
      chunks.push(String(chunk));
      return true;
    };

    const bar = createProgressBar(spriter);
    bar.refreshTotal(4);
    listeners.progress({processed: 1, total: 4});
    listeners.progress({processed: 4, total: 4});
    bar.finish();

    process.stderr.isTTY = originalIsTTY;
    process.stderr.write = originalWrite;

    const lines = chunks.join('').trim().split('\n').filter(line => line.includes('%'));
    assert.equal(lines.length, 2);
    assert.match(lines[0], /\[/u);
    assert.match(lines[0], /1\/4 \(25\.0%\)/u);
    assert.match(lines.at(-1), /4\/4 \(100\.0%\)/u);
  });
});
