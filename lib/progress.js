import process from 'node:process';

/**
 Create a terminal progress bar that renders on each progress event

 The bar is registered before shapes are added. The total number of shapes is
 updated via `refreshTotal()` after the input files have been resolved,
 because the spriter's progress events report a growing total while the queue
 processes shapes during add().

 On interactive terminals the bar is redrawn in place with a carriage return;
 otherwise each progress step is written as its own line, so progress is still
 visible when stderr is piped or not detected as a TTY.

 @param {object} spriter Spriter instance (listens to its `progress` events)
 @returns {{refreshTotal: (total: number) => void, finish: () => void}} Progress bar controls
 */
export function createProgressBar(spriter) {
  const stream = process.stderr;
  const tty = stream.isTTY;
  const barWidth = Math.max(20, (process.stdout.columns || 80) - 60);
  let lastUpdate = 0;
  let total = 0;

  const onProgress = ({processed}) => {
    if (total === 0) {
      return;
    }

    const now = Date.now();

    // On TTY, throttle redraws to keep the terminal responsive; the final
    // state is always drawn. Without a TTY every step is written as a line.
    if (tty && processed < total && now - lastUpdate < 8) {
      return;
    }

    lastUpdate = now;
    const percentage = Math.min(1, processed / total);
    const filled = Math.round(percentage * barWidth);
    const bar = '█'.repeat(filled) + '░'.repeat(Math.max(0, barWidth - filled));
    const line = `[${bar}] ${processed}/${total} (${(percentage * 100).toFixed(1)}%)`;
    stream.write(tty ? `\r${line}` : `${line}\n`);
  };

  spriter.on('progress', onProgress);

  return {
    refreshTotal(value) {
      total = value;
    },
    finish() {
      spriter.off('progress', onProgress);
      stream.write(tty ? '\n' : '');
    },
  };
}
