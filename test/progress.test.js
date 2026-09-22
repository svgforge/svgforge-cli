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

  it('does not render when not on a TTY', () => {
    const spriter = {
      on() {},
      off() {},
    };
    const originalIsTTY = process.stderr.isTTY;
    const originalWrite = process.stderr.write;

    process.stderr.isTTY = false;
    process.stderr.write = () => {
      assert.fail('should not write without a TTY');
    };

    const bar = createProgressBar(spriter);
    const result = bar.finish();

    process.stderr.isTTY = originalIsTTY;
    process.stderr.write = originalWrite;

    assert.equal(typeof result, 'undefined');
  });
});
