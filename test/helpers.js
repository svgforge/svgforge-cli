'use strict';

/**
 * Test helpers for the svg-sprite-cli test suite
 *
 * @see https://github.com/joeda1/svg-sprite-cli
 * @author Joschi Kuphal <joschi@kuphal.net> (https://github.com/jkphl)
 * @author Felix Müller
 * @copyright © 2018 Joschi Kuphal
 * @copyright © 2026 Felix Müller
 * @license MIT https://github.com/joeda1/svg-sprite-cli/blob/main/LICENSE
 */

const { execFile } = require('node:child_process');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const process = require('node:process');
const { promisify } = require('node:util');

const execFileAsync = promisify(execFile);
const cliPath = path.resolve(__dirname, '..', 'bin', 'svg-sprite.js');

/**
 * Run the CLI as a child process
 *
 * @param {Array<string>} args Command line arguments
 * @param {object} [options] Options
 * @param {string} [options.cwd] Working directory
 * @returns {Promise<{stdout: string, stderr: string}>} Process output
 */
function execCli(args, options) {
  return execFileAsync(process.execPath, [cliPath, ...args], options);
}

/**
 * Create a unique temporary directory
 *
 * @returns {string} Absolute path to the temporary directory
 */
function makeTempDir() {
  return fs.mkdtempSync(path.join(os.tmpdir(), 'svg-sprite-cli-'));
}

module.exports = {
  execCli,
  makeTempDir
};
