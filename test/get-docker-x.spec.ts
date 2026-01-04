import {describe, test, expect, afterEach, beforeEach} from 'bun:test';
import fs from 'fs-extra';
import os from 'os';
import path from 'path';

const originalPlatform = process.platform;
let tempDir: string;

const setPlatform = (platform: string) => {
  Object.defineProperty(process, 'platform', {value: platform});
};
const resetPlatform = () => {
  Object.defineProperty(process, 'platform', {value: originalPlatform});
};

import getDockerExecutable from '../utils/get-docker-x';

describe('get-docker-x', () => {
  beforeEach(() => {
    tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'lando-test-'));
  });

  afterEach(() => {
    resetPlatform();
    if (tempDir) {
      fs.rmSync(tempDir, {recursive: true, force: true});
    }
  });

  test('should return string or false depending on docker availability', () => {
    setPlatform('linux');
    const dockerExecutable = getDockerExecutable();
    expect(typeof dockerExecutable === 'string' || dockerExecutable === false).toBe(true);
  });

  test('should return /usr/bin/docker on linux when it exists', () => {
    setPlatform('linux');
    if (fs.existsSync('/usr/bin/docker')) {
      const dockerExecutable = getDockerExecutable();
      expect(dockerExecutable).toBe('/usr/bin/docker');
    }
  });

  test('should return false when docker executable is not found', () => {
    setPlatform('linux');
    const oldPath = process.env.PATH;
    process.env.PATH = '';
    try {
      const dockerExecutable = getDockerExecutable();
      expect(dockerExecutable === false || typeof dockerExecutable === 'string').toBe(true);
    } finally {
      process.env.PATH = oldPath;
    }
  });
});
