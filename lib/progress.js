import process from 'node:process';

/**
 Create a terminal progress bar that renders on each progress event

 The bar is registered before shapes are added, so the total is taken from the
 first `progress` event ({processed, total}) rather than at creation time.

 @param {object} spriter Spriter instance (listens to its `progress` events)
 @returns {() => void} Cleanup function finishing the bar line
 */
export function createProgressBar(spriter) {
  const stream = process.stderr;

  // Only render an animated bar on interactive terminals
  if (!stream.isTTY) {
    return () => {};
  }

  const barWidth = Math.max(20, (process.stdout.columns || 80) - 60);
  let lastUpdate = 0;
  let total = 0;

  const onProgress = ({processed, total: currentTotal}) => {
    total = currentTotal;

    if (total === 0) {
      return;
    }

    const now = Date.now();

    // Throttle redraws to ~30 FPS
    if (processed < total && now - lastUpdate < 33) {
      return;
    }

    lastUpdate = now;
    const percentage = processed / total;
    const filled = Math.round(percentage * barWidth);
    const bar = '█'.repeat(filled) + '░'.repeat(Math.max(0, barWidth - filled));
    stream.write(`\r[${bar}] ${processed}/${total} (${(percentage * 100).toFixed(1)}%)`);
  };

  spriter.on('progress', onProgress);

  return () => {
    spriter.off('progress', onProgress);
    stream.write('\n');
  };
}
