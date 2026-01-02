import _ from 'lodash';
import Promise from './promise.js';
import normalizer from '../utils/normalizer.js';
import getContainerId from '../utils/get-container-id.js';
import getCliEnv from '../utils/get-cli-env.js';
import shellEscape from '../utils/shell-escape.js';

// Helper to strip user from opts
// NOTE: we need this because our run command will try start/stop with run opts if it needs to
// and docker compose does not like that
const stripRun = datum => {
  const newDatum = _.cloneDeep(datum);
  if (_.has(newDatum, 'opts.detach')) delete newDatum.opts.detach;
  if (_.has(newDatum, 'opts.environment')) delete newDatum.opts.environment;
  if (_.has(newDatum, 'opts.noTTY')) delete newDatum.opts.noTTY;
  if (_.has(newDatum, 'opts.user')) delete newDatum.opts.user;
  if (_.has(newDatum, 'opts.workdir')) delete newDatum.opts.workdir;
  return newDatum;
};

// Helper to retry each
const retryEach = (data, run) => Promise.each(normalizer(data), datum => run(datum));

// Helper to run engine event commands
export const eventWrapper = (name, daemon, events, data, run) =>
  events.emit('pre-engine-autostart', data)
  .then(() => events.emit('engine-autostart', data))
  .then(() => daemon.up())
  .then(() => events.emit(`pre-engine-${name}`, data))
  .then(() => run(data))
  .then(result => events.emit(`post-engine-${name}`, data).then(() => result));

/*
 * Helper to route to build command
 */
export const build = (data, compose) => {
  // Pull
  return retryEach(data, datum => compose('pull', datum))
  // then build
  .then(() => retryEach(data, datum => compose('build', datum)));
};

/*
 * Helper to route to destroy command
 */
export const destroy = (data, compose, docker) => retryEach(data, datum => {
  return (datum.compose) ? compose('remove', datum) : docker.remove(getContainerId(datum), datum.opts);
});

/*
 * Helper to route to exist command
 */
export const exists = (data, compose, docker, ids = []) => {
  if (data.compose) return compose('getId', data).then(id => !_.isEmpty(id));
  else {
    return docker.list()
    .then(containers => {
      containers.forEach(container => {
        ids.push(container.id);
        ids.push(container.name);
      });
      return _.includes(ids, getContainerId(data));
    });
  }
};

/*
 * Helper to route to logs command
 */
export const logs = (data, compose) => retryEach(data, datum => compose('logs', datum));

/*
 * Helper to route to run command
 */
export const run = (data, compose, docker, started = true) => Promise.mapSeries(normalizer(data), datum => {
  // Merge in default cli envars
  datum.opts.environment = getCliEnv(datum.opts.environment);
  datum.kill = true;

  // Escape command if it is still a string
  if (_.isString(datum.cmd)) datum.cmd = shellEscape(datum.cmd, true);

  return docker.isRunning(getContainerId(datum)).then(isRunning => {
    started = isRunning;
      if (!isRunning) {
        return start(stripRun(datum), compose).then(() => {
        // if this is a prestart build step and its not the last one make sure we set started = true
        // this prevents us from having to stop and then restart the container during builds
        started = _.get(datum, 'opts.prestart', false) && !_.get(datum, 'opts.last', false);
      });
    }
  })
  .then(() => compose('run', _.merge({}, datum, {opts: {cmd: datum.cmd, id: datum.id}})))
  .then(async result => {
    if (_.get(datum, 'opts.prestart', false) && _.get(datum, 'opts.last', false)) delete datum.opts.services;
    if (!started || _.get(datum, 'opts.last', false)) await stop(stripRun(datum), compose, docker);
    if (!started && _.get(datum, 'opts.autoRemove', false)) await destroy(stripRun(datum), compose, docker);
    return result;
  });
});

/*
 * Helper to route to scan command
 */
export const scan = (data, compose, docker) => {
  if (data.compose) {
    return compose('getId', data).then(id => {
      if (!_.isEmpty(id)) {
        // @todo: this assumes that the container we want
        // is probably the first id returned. What happens if that is
        // not true or we need other ids for this service?
        const ids = id.split('\n');
        return docker.scan(_.trim(ids.shift()));
      }
    });
  } else if (getContainerId(data)) {
    return docker.scan(getContainerId(data));
  }
};

/*
 * Helper to route to start command
 */
export const start = (data, compose) => retryEach(data, datum => compose('start', datum));

/*
 * Helper to route to stop command
 */
export const stop = (data, compose, docker) => retryEach(data, datum => {
  return (datum.compose) ? compose(data.kill ? 'kill' : 'stop', datum) : docker.stop(getContainerId(datum));
});
