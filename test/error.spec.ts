import {describe, expect, test, jest} from 'bun:test';
import ErrorHandler from './../lib/error';
import Log from './../lib/logger';
import Metrics from './../lib/metrics';

describe('error', () => {
  describe('#ErrorHandler', () => {
    test('should return an ErrorHandler instance with correct default options', () => {
      const error = new ErrorHandler();
      expect(error).toBeInstanceOf(ErrorHandler);
      expect(error.log).toBeInstanceOf(Log);
      expect(error.metrics).toBeInstanceOf(Metrics);
    });
  });

  describe('#handle', () => {
    test('should return error code if specified', async () => {
      const error = new ErrorHandler({error: jest.fn()} as any, {report: () => Promise.resolve(true)} as any);
      const code = await error.handle({message: 'trouble', stack: 'stack', code: 666} as any);
      expect(code).toBe(666);
    });

    test('should return 1 if error code is not specified', async () => {
      const error = new ErrorHandler({error: jest.fn()} as any, {report: () => Promise.resolve(true)} as any);
      const code = await error.handle({message: 'trouble', stack: 'stack'} as any);
      expect(code).toBe(1);
    });

    test('should log message and report to metrics by default', async () => {
      const errorSpy = jest.fn();
      const error = new ErrorHandler({error: errorSpy} as any, {report: () => Promise.resolve(true)} as any);
      const code = await error.handle();
      expect(errorSpy).toHaveBeenCalledTimes(1);
      expect(code).toBe(1);
    });

    test('should not log error when error.hide is true', async () => {
      const errorSpy = jest.fn();
      const error = new ErrorHandler({error: errorSpy} as any, {report: () => Promise.resolve(true)} as any);
      await error.handle({message: 'super long', stack: 'stack', hide: true} as any);
      expect(errorSpy).toHaveBeenCalledTimes(0);
    });

    test('should log stack instead of message when error.verbose > 0', async () => {
      const errorSpy = jest.fn();
      const error = new ErrorHandler({error: errorSpy} as any, {report: () => Promise.resolve(true)} as any);
      await error.handle({message: 'message', stack: 'stack', verbose: 1, code: 4} as any);
      expect(errorSpy).toHaveBeenCalledTimes(1);
      expect(errorSpy).toHaveBeenCalledWith('stack');
    });
  });
});
