import {describe, expect, test, beforeEach} from 'bun:test';
import fs from 'fs';

import Cache from './../lib/cache';

describe('cache', () => {
  beforeEach(() => {
    fs.rmSync('/tmp/cache', {recursive: true, force: true});
  });

  describe('#Cache', () => {
    test('should return a cache instance with correct default options', () => {
      const cache = new Cache();
      expect(cache).toBeInstanceOf(Cache);
      expect(typeof cache).toBe('object');
      cache.close();
    });

    test('should return a cache instance with custom log option', () => {
      const log = {debug: () => {}};
      const cache = new Cache();
      cache.log = log;
      expect(cache.log).toBe(log);
      cache.close();
    });

    test('should return a cache instance with custom cachedir option', () => {
      const cache = new Cache();
      cache.cacheDir = '/tmp/cache';
      expect(cache.cacheDir).toBe('/tmp/cache');
      cache.close();
    });
  });

  describe('#set', () => {
    test('should set a cached key in memory', () => {
      const cache = new Cache();
      cache.set('yyz', 'amazing');
      expect(cache.get<string>('yyz')).toEqual('amazing');
      cache.close();
    });
  });

  describe('#get', () => {
    test('should return a cached key from memory', () => {
      const cache = new Cache();
      cache.set('best_drummer', 'Neal Peart');
      expect(cache.get<string>('best_drummer')).toEqual('Neal Peart');
      cache.close();
    });

    test('should return undefined when grabbing an unset key', () => {
      const cache = new Cache();
      expect(cache.get('BOGUSKEY-I-LOVE-NICK3LBACK-4-LYF')).toBeUndefined();
      cache.close();
    });
  });

  describe('#del', () => {
    test('should delete a cached key from memory', () => {
      const cache = new Cache();
      cache.set('limelight', 'universal dream');
      expect(cache.get<string>('limelight')).toEqual('universal dream');

      cache.del('limelight');
      expect(cache.get('limelight')).toBeUndefined();
      cache.close();
    });

    test('should return count of deleted keys', () => {
      const cache = new Cache();
      cache.set('key1', 'value1');
      cache.set('key2', 'value2');
      expect(cache.del(['key1', 'key2'])).toBe(2);
      cache.close();
    });
  });

  describe('#keys', () => {
    test('should return all cache keys', () => {
      const cache = new Cache();
      cache.set('key1', 'value1');
      cache.set('key2', 'value2');
      expect(cache.keys().sort()).toEqual(['key1', 'key2']);
      cache.close();
    });
  });

  describe('#has', () => {
    test('should return true for existing keys', () => {
      const cache = new Cache();
      cache.set('exists', 'yes');
      expect(cache.has('exists')).toBe(true);
      expect(cache.has('notexists')).toBe(false);
      cache.close();
    });
  });

  describe('#flushAll', () => {
    test('should clear all cached keys', () => {
      const cache = new Cache();
      cache.set('key1', 'value1');
      cache.set('key2', 'value2');
      cache.flushAll();
      expect(cache.keys()).toEqual([]);
      cache.close();
    });
  });

  describe('#setCache', () => {
    test('should set a cached key to disk', () => {
      const cache = new Cache();
      cache.cacheDir = '/tmp/cache';
      cache.setCache('yyz', 'amazing');
      expect(fs.existsSync('/tmp/cache/yyz.json')).toBe(true);
      cache.close();
    });
  });

  describe('#getCache', () => {
    test('should return a cached key from memory first', () => {
      const cache = new Cache();
      cache.cacheDir = '/tmp/cache';
      cache.set('yyz', 'amazing');
      expect(cache.getCache('yyz')).toEqual('amazing');
      cache.close();
    });

    test('should return a cached key from disk if not in memory', () => {
      const cache = new Cache();
      cache.cacheDir = '/tmp/cache';
      cache.setCache('yyz', 'amazing');
      cache.flushAll();
      expect(cache.getCache('yyz')).toEqual('amazing');
      cache.close();
    });

    test('should return undefined for non-existent key', () => {
      const cache = new Cache();
      cache.cacheDir = '/tmp/cache';
      expect(cache.getCache('nonexistent')).toBeUndefined();
      cache.close();
    });
  });

  describe('#removeCache', () => {
    test('should remove a cached key from memory and disk', () => {
      const cache = new Cache();
      cache.cacheDir = '/tmp/cache';
      cache.setCache('subdivisions', 'Sprawling on the fringes of the city');

      expect(fs.existsSync('/tmp/cache/subdivisions.json')).toBe(true);
      cache.removeCache('subdivisions');

      expect(cache.get('subdivisions')).toBeUndefined();
      expect(fs.existsSync('/tmp/cache/subdivisions.json')).toBe(false);
      cache.close();
    });
  });
});
