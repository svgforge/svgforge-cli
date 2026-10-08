import assert from 'node:assert/strict';
import {describe, it} from 'node:test';
import {formatSummary, printSummary} from '../lib/report.js';

describe('formatSummary', () => {
  it('renders one line per report section within 80 characters', () => {
    const lines = formatSummary({
      processed: 61,
      skipped: 0,
      modes: {symbol: {sprite: 'svg/sprite.symbol.svg', inline: false, example: {}}},
      files: 3,
      dest: 'dist/material',
      elapsedMs: 420,
      concurrency: 4,
    });

    assert.deepEqual(lines, [
      'shapes    61 processed',
      'modes     symbol (inline: no, example: yes)',
      'output    3 files → dist/material',
      'elapsed   0.42s (concurrency 4)',
    ]);
    assert.ok(lines.every(line => line.length <= 80), 'all lines within 80 characters');
  });

  it('describes every active mode with its enabled options', () => {
    const lines = formatSummary({
      processed: 8,
      modes: {
        view: {render: {css: true}},
        defs: {inline: true, example: {dest: 'sprite.defs.html'}},
      },
      files: 5,
      dest: 'dist/icons',
      elapsedMs: 1000,
      concurrency: 4,
    });

    assert.equal(lines[1], 'modes     view (example: no, render: css), defs (inline: yes, example: yes)');
  });

  it('reports excluded input files and a single output file', () => {
    const lines = formatSummary({
      processed: 5,
      skipped: 3,
      modes: {stack: {}},
      files: 1,
      dest: '.',
      elapsedMs: 1000,
    });

    assert.equal(lines[0], 'shapes    5 processed (3 excluded)');
    assert.equal(lines[2], 'output    1 file → .');
  });

  it('omits unknown modes and an unknown concurrency limit', () => {
    const lines = formatSummary({
      processed: 0,
      files: 0,
      dest: '.',
      elapsedMs: 0,
    });

    assert.equal(lines[1], 'modes     none');
    assert.equal(lines[3], 'elapsed   0.00s');
  });

  it('cuts overly long lines down to 80 characters', () => {
    const lines = formatSummary({
      processed: 61,
      modes: {symbol: {}},
      files: 2,
      dest: 'dist/'.repeat(50),
      elapsedMs: 420,
      concurrency: 4,
    });

    assert.ok(lines.every(line => line.length <= 80), 'all lines within 80 characters');
    assert.ok(lines[2].endsWith('…'), 'the cut line is marked with an ellipsis');
  });
});

describe('printSummary', () => {
  it('writes every summary line to the given stream', () => {
    const chunks = [];
    const stream = {
      write(chunk) {
        chunks.push(String(chunk));
      },
    };

    printSummary({
      processed: 61,
      modes: {symbol: {inline: false}},
      files: 2,
      dest: 'dist/material',
      elapsedMs: 420,
      concurrency: 4,
    }, stream);

    assert.equal(chunks.length, 4);
    assert.ok(chunks.every(chunk => chunk.endsWith('\n')), 'every line is newline terminated');
    assert.equal(chunks.join(''), `${formatSummary({
      processed: 61,
      modes: {symbol: {inline: false}},
      files: 2,
      dest: 'dist/material',
      elapsedMs: 420,
      concurrency: 4,
    }).join('\n')}\n`);
  });
});
