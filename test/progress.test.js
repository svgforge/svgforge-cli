import assert from 'node:assert/strict';
import process from 'node:process';
import {describe, it} from 'node:test';
import {setTimeout as delay} from 'node:timers/promises';
import {createProgressBar} from '../lib/progress.js';

/**
 Pretend a terminal of the given width by shadowing `stderr.columns`

 @param {number} columns Terminal width to simulate
 @returns {() => void} Restores the previous `columns` value
 */
const setStderrColumns = columns => {
  const descriptor = Object.getOwnPropertyDescriptor(process.stderr, 'columns');
  Object.defineProperty(process.stderr, 'columns', {configurable: true, value: columns, writable: true});

  return () => {
    if (descriptor) {
      Object.defineProperty(process.stderr, 'columns', descriptor);
    } else {
      delete process.stderr.columns;
    }
  };
};

/**
 Measure the length of every line that was rendered to stderr

 @param {string} rendered Complete output written to stderr
 @returns {number[]} Line lengths in the order they were written
 */
const measureLines = rendered => rendered
  .split('\r')
  .flatMap(chunk => chunk.split('\n'))
  .filter(Boolean)
  .map(line => line.length);

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

  it('caps the rendered line at 80 characters on wide terminals', () => {
    const listeners = {};
    const spriter = createSpriterStub(listeners);
    const chunks = [];
    const originalIsTTY = process.stderr.isTTY;
    const originalWrite = process.stderr.write;

    process.stderr.isTTY = true;
    const restoreColumns = setStderrColumns(200);
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
    restoreColumns();

    const lines = measureLines(chunks.join(''));
    assert.ok(lines.length > 0, 'at least one line was rendered');
    assert.ok(lines.every(length => length <= 80), `all lines within 80 characters, got ${lines.join(', ')}`);
    assert.ok(lines.every(length => length > 40), 'the bar is actually rendered');
  });

  it('shrinks the line to the width of a narrow terminal', () => {
    const listeners = {};
    const spriter = createSpriterStub(listeners);
    const chunks = [];
    const originalIsTTY = process.stderr.isTTY;
    const originalWrite = process.stderr.write;

    process.stderr.isTTY = true;
    const restoreColumns = setStderrColumns(40);
    process.stderr.write = chunk => {
      chunks.push(String(chunk));
      return true;
    };

    const bar = createProgressBar(spriter);
    bar.refreshTotal(4);
    listeners.progress({processed: 1, total: 4});
    bar.finish();

    process.stderr.isTTY = originalIsTTY;
    process.stderr.write = originalWrite;
    restoreColumns();

    const lines = measureLines(chunks.join(''));
    assert.ok(lines.length > 0, 'at least one line was rendered');
    assert.ok(lines.every(length => length <= 40), `all lines within 40 characters, got ${lines.join(', ')}`);
  });

  it('picks up terminal resizes between redraws', async () => {
    const listeners = {};
    const spriter = createSpriterStub(listeners);
    const chunks = [];
    const originalIsTTY = process.stderr.isTTY;
    const originalWrite = process.stderr.write;

    process.stderr.isTTY = true;
    const restoreColumns = setStderrColumns(120);
    process.stderr.write = chunk => {
      chunks.push(String(chunk));
      return true;
    };

    const bar = createProgressBar(spriter);
    bar.refreshTotal(8);
    listeners.progress({processed: 1, total: 8});

    // Redraws are throttled, so wait for the next slot before resizing
    await delay(12);
    restoreColumns();
    const restoreNarrowColumns = setStderrColumns(30);
    listeners.progress({processed: 4, total: 8});

    process.stderr.isTTY = originalIsTTY;
    process.stderr.write = originalWrite;
    restoreNarrowColumns();

    const lines = measureLines(chunks.join(''));
    assert.ok(lines.length >= 2, 'both redraws were written');
    assert.ok(lines[0] <= 80, `first line within 80 characters, got ${lines[0]}`);
    assert.ok(lines[1] <= 30, `second line within the resized width, got ${lines[1]}`);
  });

  it('keeps the non-TTY summary line within 80 characters', () => {
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
    bar.refreshTotal(61);
    listeners.progress({processed: 61, total: 61});
    bar.finish();

    process.stderr.isTTY = originalIsTTY;
    process.stderr.write = originalWrite;

    const lines = measureLines(chunks.join(''));
    assert.equal(lines.length, 1, 'exactly one summary line');
    assert.ok(lines[0] <= 80, `summary line within 80 characters, got ${lines[0]}`);
  });
});
