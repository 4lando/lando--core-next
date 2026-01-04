

import {describe, test, expect, beforeEach, afterEach} from 'bun:test';
import fs from 'fs';
import os from 'os';
import path from 'path';

const originalPlatform = process.platform;
let tempDir;

const setPlatform = platform => {
  Object.defineProperty(process, 'platform', {value: platform});
};
const resetPlatform = () => {
  Object.defineProperty(process, 'platform', {value: originalPlatform});
};

import getComposeExecutable from '../utils/get-compose-x';

describe('get-compose-x', () => {
  beforeEach(() => {
    tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'lando-test-'));
  });

  afterEach(() => {
    resetPlatform();
    if (tempDir && fs.existsSync(tempDir)) {
      fs.rmSync(tempDir, {recursive: true, force: true});
    }
  });

  test('should return the correct lando-provided path on linux when executable exists', () => {
    setPlatform('linux');
    const binPath = path.join(tempDir, 'bin');
    fs.mkdirSync(binPath, {recursive: true});
    const composePath = path.join(binPath, 'docker-compose-v2.31.0');
    fs.writeFileSync(composePath, '#!/bin/bash\necho "docker-compose"');
    fs.chmodSync(composePath, 0o755);

    const composeExecutable = getComposeExecutable({userConfRoot: tempDir});
    expect(typeof composeExecutable).toBe('string');
    expect(composeExecutable).toContain('docker-compose-v2.31.0');
  });

  test('should return a string path or false if not found', () => {
    const composeExecutable = getComposeExecutable();
    expect(typeof composeExecutable === 'string' || composeExecutable === false).toBe(true);
  });

  test('should return a valid path object when parsed if found', () => {
    const composeExecutable = getComposeExecutable();
    if (typeof composeExecutable === 'string') {
      expect(typeof path.parse(composeExecutable)).toBe('object');
    } else {
      expect(composeExecutable).toBe(false);
    }
  });
});
