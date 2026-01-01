import {execSync} from 'child_process';
import getComposeBinPath from './get-compose-bin-path.js';

import _ from 'lodash';
import fs from 'fs';
import os from 'os';
import path from 'path';

const which = (bin: string): string | null => {
  if (typeof Bun !== 'undefined' && Bun.which) return Bun.which(bin);
  try {
    return execSync(`which ${bin}`, {encoding: 'utf8'}).trim();
  } catch {
    return null;
  }
};

const getDockerBin = (bin, base, pathFallback = true) => {
  const join = (process.platform === 'win32') ? path.win32.join : path.posix.join;
  let binPath = (process.platform === 'win32') ? join(base, `${bin}.exe`) : join(base, bin);

  // Fall back to PATH executable on posix if the expected binary doesn't exist
  if (pathFallback && process.platform !== 'win32' && (!fs.existsSync(binPath) || fs.statSync(binPath).isDirectory())) {
    binPath = _.toString(which(bin));
  }

  // If the binpath still does not exist then we should set to false and handle downstream
  if (!fs.existsSync(binPath)) return false;

  // Otherwise return a normalized binpath
  switch (process.platform) {
    case 'darwin': return path.posix.normalize(binPath);
    case 'linux': return path.posix.normalize(binPath);
    case 'win32': return path.win32.normalize(binPath);
  }
};

export default ({orchestratorVersion = '2.31.0', userConfRoot = os.tmpdir()} = {}) => {
  const orchestratorBin = `docker-compose-v${orchestratorVersion}`;
  switch (process.platform) {
    case 'darwin':
    case 'linux':
      // use lando bin if available
      if (fs.existsSync(path.join(userConfRoot, 'bin', orchestratorBin))) {
        return getDockerBin(orchestratorBin, path.join(userConfRoot, 'bin'), false);
      }
      // otherwise use docker desktop one if available
      return getDockerBin('docker-compose', getComposeBinPath(), process.platform === 'linux');
    case 'win32':
      // use lando bin if available
      if (fs.existsSync(path.join(userConfRoot, 'bin', `${orchestratorBin}.exe`))) {
        return getDockerBin(orchestratorBin, path.join(userConfRoot, 'bin'), false);
      }
      // otherwise use docker desktop one if available
      return getDockerBin('docker-compose', getComposeBinPath());
  }
};
