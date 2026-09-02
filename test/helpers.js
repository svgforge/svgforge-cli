import {execFile} from 'node:child_process';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import process from 'node:process';
import {fileURLToPath} from 'node:url';
import {promisify} from 'node:util';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const execFileAsync = promisify(execFile);
const cliPath = path.resolve(__dirname, '..', 'bin', 'svgforge.js');

/**
 Run the CLI as a child process

 @param {Array<string>} args Command line arguments
 @param {object} [options] Spawn options for the child process
 @param {string} [options.cwd] Working directory
 @returns {Promise<{stdout: string, stderr: string}>} Process output
 */
export function execCli(args, options) {
  return execFileAsync(process.execPath, [cliPath, ...args], options);
}

/**
 Create a unique temporary directory

 @returns {string} Absolute path to the temporary directory
 */
export function makeTemporaryDir() {
  return fs.mkdtempSync(path.join(os.tmpdir(), 'svgforge-cli-'));
}
