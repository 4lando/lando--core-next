

import {describe, expect, test, beforeEach} from 'bun:test';
import fs from 'fs';
import os from 'os';
import path from 'path';
import Lando from './../.';

const cliMock = {
  confirm: () => {},
  formatOptions: () => {},
  makeArt: () => {},
};

describe('lando', () => {
  beforeEach(() => {
    fs.rmSync('/tmp/cache', {recursive: true, force: true});
  });

  describe('#Lando', () => {
    test('should return a Lando instance with correct default options', () => {
      const lando = new Lando();
      expect(lando).toBeInstanceOf(Lando);
    });

    test('should generate a unique instance id', () => {
      const lando = new Lando({userConfRoot: os.tmpdir()});
      expect(typeof lando.config.id).toBe('string');
      expect(lando.config.id.length).toBeGreaterThan(0);
      expect(lando.config.user).toBe(lando.config.id);
    });

    test('should have a cache instance', () => {
      const lando = new Lando({userConfRoot: os.tmpdir()});
      expect(lando.cache).toBeDefined();
      expect(typeof lando.cache.get).toBe('function');
      expect(typeof lando.cache.set).toBe('function');
    });
  });

  describe('#bootstrap', () => {
    test('should return a lando object with the default config', async () => {
      const lando = new Lando({logLevelConsole: 'warn'});
      const result = await lando.bootstrap('config');
      expect(result.config.userConfRoot).toBe(os.tmpdir());
      expect(Array.isArray(result.config.plugins)).toBe(true);
      expect(result.config.plugins.length).toBeGreaterThan(0);
    });

    test('should mix envvars into config with set prefix', async () => {
      process.env.JOURNEY_PRODUCT = 'steveperry';
      process.env.JOURNEY_MODE = 'rocknroll';
      const lando = new Lando({envPrefix: 'JOURNEY'});
      const result = await lando.bootstrap('config');
      expect(result.config.userConfRoot).toBe(os.tmpdir());
      expect(Array.isArray(result.config.plugins)).toBe(true);
      expect(result.config.plugins.length).toBeGreaterThan(0);
      expect(result.config.product).toBe(process.env.JOURNEY_PRODUCT);
      expect(result.config.mode).toBe(process.env.JOURNEY_MODE);
      delete process.env.JOURNEY_PRODUCT;
      delete process.env.JOURNEY_MODE;
    });

    test('should mix config files into config', async () => {
      const srcRoot = path.resolve(__dirname, '..');
      const lando = new Lando({
        configSources: [path.resolve(srcRoot, 'config.yml')],
        pluginDirs: [srcRoot],
      });
      lando.cli = cliMock;
      const result = await lando.bootstrap('config');
      expect(Array.isArray(result.config.plugins)).toBe(true);
      expect(result.config.plugins.length).toBeGreaterThan(0);
      lando.tasks.tasks = [];
    });
  });
});
