import {describe, expect, test} from 'bun:test';
import Log from '../lib/logger';

describe('Log', () => {
  test('should return a Log instance with required methods', () => {
    const log = new Log({});
    expect(log).toBeInstanceOf(Log);
    expect(typeof log.error).toBe('function');
    expect(typeof log.warn).toBe('function');
    expect(typeof log.info).toBe('function');
    expect(typeof log.verbose).toBe('function');
    expect(typeof log.debug).toBe('function');
    expect(typeof log.silly).toBe('function');
    expect(typeof log.alsoSanitize).toBe('function');
  });

  test('should call log methods without throwing', () => {
    const log = new Log({logLevelConsole: 'error'});
    expect(() => log.error('test error')).not.toThrow();
    expect(() => log.warn('test warn')).not.toThrow();
    expect(() => log.info('test info')).not.toThrow();
    expect(() => log.verbose('test verbose')).not.toThrow();
    expect(() => log.debug('test debug')).not.toThrow();
    expect(() => log.silly('test silly')).not.toThrow();
  });

  test('should accept log options', () => {
    expect(() => new Log({
      logDir: '/tmp/test-log-dir',
      logLevelConsole: 'warn',
      logLevel: 'debug',
      logName: 'test-log',
    })).not.toThrow();
  });

  test('should support alsoSanitize for adding keys to redact', () => {
    const log = new Log({});
    expect(() => log.alsoSanitize('password')).not.toThrow();
    expect(() => log.alsoSanitize('secret')).not.toThrow();
  });

  test('should support metadata in log calls', () => {
    const log = new Log({logLevelConsole: 'error'});
    expect(() => log.info('test message', {key: 'value'})).not.toThrow();
    expect(() => log.error('test error', {error: 'details'})).not.toThrow();
  });
});
