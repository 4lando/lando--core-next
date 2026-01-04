import {describe, expect, test, beforeEach, afterEach, jest} from 'bun:test';
import _ from 'lodash';
import axios from 'axios';
import legacyScan from '../utils/legacy-scan.js';

describe('legacy-scan', () => {
  let originalCreate: typeof axios.create;

  beforeEach(() => {
    const counter: Record<string, number> = {};
    originalCreate = axios.create;
    (axios as any).create = jest.fn(() => ({
      get: async (url: string) => {
        counter[url] = (counter[url] || 0) + 1;
        const last = _.last(url.split('.')) as string;
        let code: string | number = 200;
        if (_.includes(last, ':')) {
          const parts = last.split(':');
          const targetCount = _.toInteger(parts[1]);
          if (targetCount > 0 && counter[url] >= targetCount) {
            code = 200;
          } else {
            code = parts[0];
          }
        } else {
          code = isFinite(Number(last)) ? Number(last) : 200;
        }
        const numCode = _.toInteger(code);
        if (numCode >= 200 && numCode < 300) {
          return Promise.resolve({status: numCode});
        }
        return Promise.reject({response: {status: numCode}});
      },
    }));
  });

  afterEach(() => {
    axios.create = originalCreate;
  });

  test('should return "good" status objects on status code 2xx', async () => {
    const scan = legacyScan();
    const urls = ['http://www.thecultofscottbakula.com', 'http://anumalak.com'];
    const results = await scan(urls);
    for (const result of results) {
      expect(result.status).toBe(true);
      expect(result.color).toBe('green');
    }
  });

  test('should return "ok" status objects on wildcard entries', async () => {
    const scan = legacyScan();
    const urls = ['http://*.thecultofscottbakula.com', 'http://*.anumalak.com'];
    const results = await scan(urls);
    for (const result of results) {
      expect(result.status).toBe(true);
      expect(result.color).toBe('yellow');
    }
  });

  test('should return "bad" status objects on permanent error codes', async () => {
    const scan = legacyScan();
    const urls = ['http://thecultofscottbakula.com.404', 'http://anumalak.com.500'];
    const results = await scan(urls, {max: 1});
    for (const result of results) {
      expect(result.status).toBe(false);
      expect(result.color).toBe('red');
    }
  });
});
