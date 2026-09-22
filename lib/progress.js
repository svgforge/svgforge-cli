import process from 'node:process';

/**
 Create a terminal progress bar that renders on each progress event

 @param {object} spriter Spriter instance (listens to its `progress` events)
 @param {number} total Total number of shapes to process
 @returns {() => void} Cleanup function finishing the bar line
 */
export function createProgressBar(spriter, total) {
  const stream = process.stderr;

  // Only render an animated bar on interactive terminals
  if (total === 0 || !stream.isTTY) {
    return () => {};
  }

  const barWidth = Math.max(20, (process.stdout.columns || 80) - 60);
  let lastUpdate = 0;

  const onProgress = ({processed}) => {
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
