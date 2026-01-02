import {describe, expect, test, beforeEach, afterEach, jest} from 'bun:test';
import _ from 'lodash';
import axios from 'axios';
import Promise from '../lib/promise.js';
import legacyScan from '../utils/legacy-scan.js';

describe('legacy-scan', () => {
  let originalCreate;

  beforeEach(() => {
    const counter: Record<string, number> = {};
    originalCreate = axios.create;
    axios.create = jest.fn(() => ({
      get: (url: string) => {
        counter[url] = counter[url] + 1 || 0;
        const last = _.last(url.split('.')) as string;
        let code: string | number = 200;
        if (_.includes(last, ':')) {
          if (_.toInteger(last.split(':')[1]) === counter[url]) code = 200;
          else code = last.split(':')[0];
        } else {
          code = isFinite(Number(_.last(url.split('.')))) ? (_.last(url.split('.')) as string) : 200;
        }
        return (_.startsWith(String(code), '2')) ? Promise.resolve() : Promise.reject({response: {status: _.toInteger(code)}});
      },
    }));
  });

  afterEach(() => {
    axios.create = originalCreate;
  });

  test('should return "good" status objects on status code 2xx', async () => {
    const scan = legacyScan();
    const urls = ['http://www.thecultofscottbakula.com', 'http://anumalak.com:'];
    const results = await scan(urls);
    for (const result of results) {
      expect(result.status).toBe(true);
      expect(result.color).toBe('green');
    }
  });

  test('should return "good" status objects on non-wait codes', async () => {
    const scan = legacyScan();
    const urls = ['http://thecultofscottbakula.com:503', 'http://anumalak.com:503'];
    const results = await scan(urls);
    for (const result of results) {
      expect(result.status).toBe(true);
      expect(result.color).toBe('green');
    }
  });

  test('should return "ok" status objects on wildcard entries', async () => {
    const scan = legacyScan();
    const urls = ['http://*.thecultofscottbakula.com', 'http://*.anumalak.com:'];
    const results = await scan(urls);
    for (const result of results) {
      expect(result.status).toBe(true);
      expect(result.color).toBe('yellow');
    }
  });

  test('should return "bad" status objects on wait codes that don\'t change after max retries', async () => {
    const scan = legacyScan();
    const urls = ['http://thecultofscottbakula.com.666', 'http://anumalak.com.404'];
    const results = await scan(urls, {max: 1, waitCodes: [666, 404]});
    for (const result of results) {
      expect(result.status).toBe(false);
      expect(result.color).toBe('red');
    }
  });

  test('should return "good" status objects on wait codes that become non-wait codes after retry', async () => {
    const scan = legacyScan();
    const urls = ['http://thecultofscottbakula.com.666:2'];
    const results = await scan(urls, {max: 2, waitCodes: [666]});
    for (const result of results) {
      expect(result.status).toBe(true);
      expect(result.color).toBe('green');
    }
  });
});
