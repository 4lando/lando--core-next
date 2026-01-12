import _ from 'lodash';

// Helper object for flags
const composeFlags = {
  background: '--detach',
  detach: '--detach',
  follow: '--follow',
  force: '--force',
  noCache: '--no-cache',
  noRecreate: '--no-recreate',
  noDeps: '--no-deps',
  noTTY: '-T',
  pull: '--pull',
  q: '--quiet',
  recreate: '--force-recreate',
  removeOrphans: '--remove-orphans',
  rm: '--rm',
  timestamps: '--timestamps',
  volumes: '-v',
};

// Default options nad things
const defaultOptions = {
  build: {noCache: false, pull: true},
  down: {removeOrphans: true, volumes: true},
  exec: {detach: false, noTTY: !process.stdin.isTTY},
  kill: {},
  logs: {follow: false, timestamps: false},
  ps: {q: true},
  pull: {},
  rm: {force: true, volumes: true},
  up: {background: true, noRecreate: true, recreate: false, removeOrphans: true},
};

/*
 * Helper to merge options with default
 */
const mergeOpts = (run, opts = {}) => _.merge({}, defaultOptions[run], opts);

/*
 * Parse docker-compose options
 */
const parseOptions = (opts = {}) => {
  const flags = _.map(composeFlags, (value, key) => _.get(opts, key, false) ? value : '');
  const environment = _.flatMap(opts.environment, (value, key) => ['--env', `${key}=${value}`]);
  const user = (_.has(opts, 'user')) ? ['--user', opts.user] : [];
  const workdir = (_.has(opts, 'workdir')) ? ['--workdir', opts.workdir] : [];
  const entrypoint = _.map(opts.entrypoint, entrypoint => ['--entrypoint', entrypoint]);
  return _.compact(_.flatten([flags, environment, user, workdir, entrypoint]));
};

/*
 * Helper to standardize construction of docker commands
 */
const buildCmd = (run, name, compose, {services, cmd}, opts = {}) => {
  if (!name) throw new Error('Need to give this composition a project name!');
  // @TODO: we need to strip out opts.user on start/stop because we often get it as part of run
  const project = ['--project-name', name];
  const files = _.flatten(_.map(compose, unit => ['--file', unit]));
  const options = parseOptions(opts);
  const argz = _.flatten(_.compact([services, cmd]));
  return _.flatten([project, files, run, options, argz]);
};

/*
 *  Helper to build build object needed by lando.shell.sh
 */
const buildShell = (run, name, compose, opts = {}) => ({
  cmd: buildCmd(run, name, compose, {services: opts.services, cmd: opts.cmd}, mergeOpts(run, opts)),
  opts: {mode: 'spawn', cstdio: opts.cstdio, silent: opts.silent},
});

/*
 * Run docker compose build
 */
export const build = (compose, project, opts = {}) => {
  const buildServices = _(opts.local).filter(service => {
    return _.isEmpty(opts.services) || _.includes(opts.services, service);
  }).value();
  if (!_.isEmpty(buildServices)) return buildShell('build', project, compose, {pull: _.isEmpty(opts.local), services: buildServices});
  else return buildShell('ps', project, compose, {});
};

/*
 * Run docker compose pull
 */
export const getId = (compose, project, opts = {}) => buildShell('ps', project, compose, opts);

/*
 * Run docker compose kill
 */
export const kill = (compose, project, opts = {}) => buildShell('kill', project, compose, opts);

/*
 * Run docker compose logs
 */
export const logs = (compose, project, opts = {}) => buildShell('logs', project, compose, opts);

/*
 * Run docker compose pull
 */
export const pull = (compose, project, opts = {}) => {
  const pullServices = _(opts.pullable).filter(service => {
    return _.isEmpty(opts.services) || _.includes(opts.services, service);
  }).value();
  if (!_.isEmpty(pullServices)) return buildShell('pull', project, compose, {services: pullServices});
  else return buildShell('ps', project, compose, {});
};

/*
 * Run docker compose remove
 */
export const remove = (compose, project, opts = {}) => {
  const subCmd = (opts.purge) ? 'down' : 'rm';
  return buildShell(subCmd, project, compose, opts);
};

/*
 * Run docker compose run
 */
export const run = (compose, project, opts = {}) => {
  // add some deep handling for detaching
  // @TODO: should we let and explicit set of opts.detach override this?
  // thinking probably not because & is just not going to work the way you want without detach?
  // that said we can skip this if detach is already set to true
  if (opts.detach !== true) {
    if (opts.cmd[0] === '/etc/lando/exec.sh' && opts.cmd[opts.cmd.length - 1] === '&') {
      opts.cmd.pop();
      opts.detach = true;
    } else if (opts.cmd[0].endsWith('sh') && opts.cmd[1] === '-c' && opts.cmd[2].endsWith('&')) {
      opts.cmd[2] = opts.cmd[2].slice(0, -1).trim();
      opts.detach = true;
    } else if (opts.cmd[0].endsWith('bash') && opts.cmd[1] === '-c' && opts.cmd[2].endsWith('&')) {
      opts.cmd[2] = opts.cmd[2].slice(0, -1).trim();
      opts.detach = true;
    } else if (opts.cmd[opts.cmd.length - 1] === '&') {
      opts.cmd.pop();
      opts.detach = true;
    }
  }

  // and return
  return buildShell('exec', project, compose, opts);
};

/*
 * You can do a create, rebuild and start with variants of this
 */
export const start = (compose, project, opts = {}) => buildShell('up', project, compose, opts);

/*
 * Run docker compose stop
 */
export const stop = (compose, project, opts = {}) => buildShell('stop', project, compose, opts);

// Default export for backward compatibility
export default {
  build,
  getId,
  kill,
  logs,
  pull,
  remove,
  run,
  start,
  stop,
};
