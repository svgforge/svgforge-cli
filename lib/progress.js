import process from 'node:process';

/**
 Longest possible progress line, including the surrounding brackets and the
 counter text

 @type {number}
 */
const MAX_LINE_WIDTH = 80;

/**
 Create a terminal progress bar that renders on each progress event

 The bar is registered before shapes are added. The total number of shapes is
 updated via `refreshTotal()` after the input files have been resolved,
 because the spriter's progress events report a growing total while the queue
 processes shapes during add().

 On interactive terminals the bar is redrawn in place with a carriage return,
 throttled to keep the terminal responsive. Without a TTY (CI, pipes, log
 files) nothing is written while running — only a single summary line with the
 final state is written on finish(), so CI logs stay free of one line per
 processed shape.

 The rendered line never exceeds 80 characters and never exceeds the current
 terminal width. The width is read for every redraw because terminals (xterm
 in particular) are resized while a run is in progress.

 @param {object} spriter Spriter instance (listens to its `progress` events)
 @returns {{refreshTotal: (total: number) => void, finish: () => void}} Progress bar controls
 */
export function createProgressBar(spriter) {
  const stream = process.stderr;
  const tty = stream.isTTY;
  let lastUpdate = 0;
  let total = 0;
  let processed = 0;

  const formatLine = value => {
    const percentage = Math.min(1, value / total);
    const text = `${value}/${total} (${(percentage * 100).toFixed(1)}%)`;

    // Brackets, bar and counter text together must fit into the terminal
    // width without ever surpassing the maximum line width
    const maxWidth = Math.min(MAX_LINE_WIDTH, stream.columns || MAX_LINE_WIDTH);
    const barWidth = Math.max(0, maxWidth - text.length - 3);
    const filled = Math.round(percentage * barWidth);
    const bar = '█'.repeat(filled) + '░'.repeat(Math.max(0, barWidth - filled));

    return barWidth > 0 ? `[${bar}] ${text}` : text;
  };

  const onProgress = ({processed: current}) => {
    processed = current;

    if (total === 0 || !tty) {
      return;
    }

    // Throttle redraws on TTY to keep the terminal responsive; the final
    // state is always drawn on finish().
    const now = Date.now();
    if (processed < total && now - lastUpdate < 8) {
      return;
    }

    lastUpdate = now;
    stream.write(`\r${formatLine(processed)}`);
  };

  spriter.on('progress', onProgress);

  return {
    refreshTotal(value) {
      total = value;
    },
    finish() {
      spriter.off('progress', onProgress);
      if (tty) {
        stream.write('\n');
      } else if (total > 0) {
        stream.write(`${formatLine(processed)}\n`);
      }
    },
  };
}
