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
      resvg: true,
    });

    assert.deepEqual(lines, [
      'shapes    61 processed',
      'modes     symbol (inline: no, example: yes)',
      'resvg     available',
      'output    3 files → dist/material',
      'elapsed   0.42s (concurrency 4)',
    ]);
    assert.ok(lines.every(line => line.length <= 80), 'all lines within 80 characters');
  });

  it('reports the CLI version when it is provided', () => {
    const lines = formatSummary({
      processed: 2,
      modes: {symbol: {}},
      files: 1,
      dest: '.',
      elapsedMs: 500,
      resvg: true,
      cliVersion: '3.1.0',
    });

    assert.equal(lines.at(-1), 'version   svgforge-cli 3.1.0');
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

  it('reports the optional resvg fallback status', () => {
    const lines = formatSummary({
      processed: 5,
      skipped: 3,
      modes: {stack: {}},
      files: 1,
      dest: '.',
      elapsedMs: 1000,
      resvg: false,
    });

    assert.equal(lines[0], 'shapes    5 processed (3 excluded)');
    assert.equal(lines[2], 'resvg     not installed');
  });

  it('appends an install tip when shapes were skipped for missing dimensions', () => {
    const lines = formatSummary({
      processed: 2,
      skipped: 0,
      modes: {symbol: {}},
      files: 1,
      dest: '.',
      elapsedMs: 500,
      resvg: false,
      dimensionSkipped: 1,
    });

    assert.equal(lines[1], 'skipped   1 (1 without dimensions)');
    assert.equal(lines[3], 'resvg     not installed');
    assert.equal(lines[6], 'tip       npm install @resvg/resvg-js (enables the dimension fallback)');
  });

  it('lists skipped shapes with the reason they were dropped', () => {
    const lines = formatSummary({
      processed: 4,
      skipped: 0,
      modes: {symbol: {}},
      files: 1,
      dest: '.',
      elapsedMs: 500,
      resvg: true,
      dimensionSkipped: 1,
      errorSkipped: 2,
    });

    assert.equal(lines[0], 'shapes    4 processed');
    assert.equal(lines[1], 'skipped   3 (2 failed, 1 without dimensions)');
  });

  it('omits the skipped line when nothing was dropped', () => {
    const lines = formatSummary({
      processed: 4,
      skipped: 0,
      modes: {symbol: {}},
      files: 1,
      dest: '.',
      elapsedMs: 500,
      resvg: true,
      dimensionSkipped: 0,
      errorSkipped: 0,
    });

    assert.equal(lines[1], 'modes     symbol (example: no)');
  });

  it('omits the install tip when no shapes needed the fallback', () => {
    const lines = formatSummary({
      processed: 2,
      files: 1,
      dest: '.',
      elapsedMs: 500,
      resvg: false,
      dimensionSkipped: 0,
    });

    assert.equal(lines.length, 5);
  });

  it('omits unknown modes and an unknown concurrency limit', () => {
    const lines = formatSummary({
      processed: 0,
      files: 0,
      dest: '.',
      elapsedMs: 0,
    });

    assert.equal(lines[1], 'modes     none');
    assert.equal(lines[2], 'resvg     not installed');
    assert.equal(lines[4], 'elapsed   0.00s');
  });

  it('cuts overly long lines down to 80 characters', () => {
    const lines = formatSummary({
      processed: 61,
      modes: {symbol: {}},
      files: 2,
      dest: 'dist/'.repeat(50),
      elapsedMs: 420,
      concurrency: 4,
      resvg: true,
    });

    assert.ok(lines.every(line => line.length <= 80), 'all lines within 80 characters');
    assert.ok(lines[3].endsWith('…'), 'the cut line is marked with an ellipsis');
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
      resvg: true,
    }, stream);

    assert.equal(chunks.length, 5);
    assert.ok(chunks.every(chunk => chunk.endsWith('\n')), 'every line is newline terminated');
    assert.equal(chunks.join(''), `${formatSummary({
      processed: 61,
      modes: {symbol: {inline: false}},
      files: 2,
      dest: 'dist/material',
      elapsedMs: 420,
      concurrency: 4,
      resvg: true,
    }).join('\n')}\n`);
  });
});
