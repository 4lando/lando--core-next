import runCommand from './run-command.js';

// Modules
import merge from 'lodash/merge';
import createDebug from './debug.js';

// Create debug logger
const defaultDebug = createDebug('@lando/get-wsl-status');

// get the bosmang
const defaults = {
  debug: defaultDebug,
  ignoreReturnCode: true,
  env: {...process.env, WSL_UTF8: 1},
};

export default async (options = {}) => {
  const args = ['-Command', 'wsl --status'];
  const opts = merge({}, defaults, options);
  const {debug} = opts;
  const {code, stdout} = await runCommand('powershell', args, opts);

  // lets try to sus things out by first making sure we have something parseable
  const data = !stdout.includes('Default Version') ? Buffer.from(stdout, 'utf8').toString('utf16le') : stdout;

  // try to get version
  const versionLine = data.split('\n').filter(line => line.includes('Default Version'))[0];
  const versionString = versionLine ?? '';
  const version = typeof versionString.split(':')[1] === 'string' ? versionString.split(':')[1].trim() : undefined;

  // debug
  debug('discovered wsl version %o with code %o', version, code);

  return {
    installed: (code === 0 || code === 1) && version !== undefined,
    features: !data.includes('"Virtual Machine Platform"') && !data.includes('"Windows Subsystem for Linux"'),
    version,
  };
};

