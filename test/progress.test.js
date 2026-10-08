import assert from 'node:assert/strict';
import process from 'node:process';
import {describe, it} from 'node:test';
import {createProgressBar} from '../lib/progress.js';

const createSpriterStub = listeners => ({
  on(event, fn) {
    listeners[event] = fn;
  },
  off(event) {
    delete listeners[event];
  },
});

describe('createProgressBar', () => {
  it('writes an animated progress bar on interactive terminals', () => {
    const listeners = {};
    const spriter = createSpriterStub(listeners);
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

  it('writes nothing while running when not on a TTY', () => {
    const listeners = {};
    const spriter = createSpriterStub(listeners);
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
    listeners.progress({processed: 2, total: 4});
    listeners.progress({processed: 4, total: 4});

    assert.equal(chunks.length, 0, 'no output before finish()');

    bar.finish();

    process.stderr.isTTY = originalIsTTY;
    process.stderr.write = originalWrite;

    const rendered = chunks.join('');
    assert.equal(rendered.split('\n').filter(Boolean).length, 1, 'exactly one summary line');
    assert.ok(rendered.startsWith('['));
    assert.match(rendered, /4\/4 \(100\.0%\)\n/u);
    assert.ok(!rendered.includes('\r'), 'no carriage-return redraws');
  });

  it('writes no summary line when there is nothing to process', () => {
    const listeners = {};
    const spriter = createSpriterStub(listeners);
    const chunks = [];
    const originalIsTTY = process.stderr.isTTY;
    const originalWrite = process.stderr.write;

    process.stderr.isTTY = false;
    process.stderr.write = chunk => {
      chunks.push(String(chunk));
      return true;
    };

    const bar = createProgressBar(spriter);
    bar.refreshTotal(0);
    bar.finish();

    process.stderr.isTTY = originalIsTTY;
    process.stderr.write = originalWrite;

    assert.equal(chunks.join(''), '');
  });
});
