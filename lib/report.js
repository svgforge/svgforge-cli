import process from 'node:process';

/**
 Longest possible summary line

 @type {number}
 */
const MAX_LINE_WIDTH = 80;

/**
 Number of characters reserved for the left-hand label of a summary line

 @type {number}
 */
const LABEL_WIDTH = 10;

/**
 Cut a summary line down to the maximum line width

 @param {string} line Line to cut
 @returns {string} The line, shortened to `MAX_LINE_WIDTH` characters if needed
 */
function fit(line) {
  return line.length <= MAX_LINE_WIDTH
    ? line
    : `${line.slice(0, MAX_LINE_WIDTH - 1)}…`;
}

/**
 Describe a single sprite mode along with its enabled options

 @param {string} mode Mode name (e.g. "symbol")
 @param {object} modeConfig Mode configuration
 @returns {string} Human readable mode description
 */
function describeMode(mode, modeConfig) {
  const inlineFlag = Object.hasOwn(modeConfig, 'inline')
    ? [`inline: ${modeConfig.inline ? 'yes' : 'no'}`]
    : [];
  const exampleFlag = [`example: ${modeConfig.example ? 'yes' : 'no'}`];
  const renderTypes = Object.entries(modeConfig.render ?? {})
    .filter(([, enabled]) => enabled)
    .map(([type]) => type);
  const renderFlag = renderTypes.length > 0 ? [`render: ${renderTypes.join(', ')}`] : [];
  const flags = [...inlineFlag, ...exampleFlag, ...renderFlag];

  return `${mode} (${flags.join(', ')})`;
}

/**
 Format the end-of-run summary as a list of lines

 Every line is padded to a common label width and cut down to
 `MAX_LINE_WIDTH` characters.

 @param {object} stats Run statistics
 @param {number} stats.processed Number of processed shapes
 @param {number} [stats.skipped] Number of input files excluded from processing
 @param {object} [stats.modes] Active sprite modes with their configuration
 @param {number} stats.files Number of files written
 @param {string} stats.dest Main output directory
 @param {number} stats.elapsedMs Elapsed run time in milliseconds
 @param {number} [stats.concurrency] Maximum number of concurrently processed shapes
 @returns {string[]} Summary lines
 */
export function formatSummary(stats) {
  const excluded = stats.skipped > 0 ? ` (${stats.skipped} excluded)` : '';
  const modes = Object.entries(stats.modes ?? {})
    .map(([mode, modeConfig]) => describeMode(mode, modeConfig));
  const concurrency = typeof stats.concurrency === 'number'
    ? ` (concurrency ${stats.concurrency})`
    : '';

  const entries = [
    ['shapes', `${stats.processed} processed${excluded}`],
    ['modes', modes.length > 0 ? modes.join(', ') : 'none'],
    ['output', `${stats.files} file${stats.files === 1 ? '' : 's'} → ${stats.dest}`],
    ['elapsed', `${(stats.elapsedMs / 1000).toFixed(2)}s${concurrency}`],
  ];

  return entries.map(([label, value]) => fit(`${label.padEnd(LABEL_WIDTH)}${value}`));
}

/**
 Write the end-of-run summary to the given stream

 @param {object} stats Run statistics (see `formatSummary`)
 @param {object} [stream] Output stream (defaults to `stderr`)
 @returns {void}
 */
export function printSummary(stats, stream = process.stderr) {
  for (const line of formatSummary(stats)) {
    stream.write(`${line}\n`);
  }
}
