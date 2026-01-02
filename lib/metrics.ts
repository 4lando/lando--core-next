import _ from 'lodash';
import cleanStack from 'clean-stacktrace';
import getAxios from '../utils/get-axios.js';
import Log from './logger.js';
import path from 'path';
import Promise from './promise.js';

const cleanLine = (line = '') => {
  const m = /.*\((.*)\).?/.exec(line) || [];
  return m[1] ? line.replace(m[1], _.last(m[1].split(path.sep))) : line;
};

const cleanseData = data => {
  if (!_.isEmpty(data.stack)) data.stack = cleanStack(data.stack, cleanLine);
  if (!_.isEmpty(data.message)) data.message = cleanLine(data.message);
  return data;
};

export default class Metrics {
  id: string;
  log: any;
  endpoints: any[];
  data: any;

  constructor({id = 'unknown', log = new Log(), endpoints = [], data = {}} = {}) {
    this.id = id;
    this.log = log;
    this.endpoints = endpoints;
    this.data = data;
  }

  report(action = 'unknown', data = {}) {
    // Get Stuff
    const log = this.log;
    const id = this.id;
    // Attempt to sanitize merged data as much as possible
    const send = cleanseData(_.merge({}, this.data, data, {action, created: new Date().toJSON()}));
    // Filter out any inactive endpoints and report to each
    const activeEndpoints = this.endpoints.filter(endpoint => endpoint.report);

    return Promise.all(activeEndpoints.map(endpoint => {
      log.verbose('reporting %s action to', action, this.endpoints);
      log.debug('reporting data', send);

      const agent = getAxios({baseURL: endpoint.url});

      return agent.post('/metrics/v2/' + id, send).catch(error => {
        const url = _.get(endpoint, 'url', 'unknown');
        const status = _.get(error, 'response.status', 'unknown');
        const reason = _.get(error, 'response.statusText', 'unknown');
        const message = _.get(error, 'response.data.message', 'unknown');
        log.debug('metrics post to %s failed with %s (%s) %s', url, status, reason, message);
      });
    }));
  }
}
