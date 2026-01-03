import mergePromise from './merge-promise.js';

// Modules
import merge from 'lodash/merge';
import {color} from './listr2.js';
import {spawn} from 'child_process';
import createDebug from './debug.js';

// Create debug logger for this module
const defaultDebug = createDebug('@lando/run-command');

// get the bosmang
const defaults = {
  debug: defaultDebug,
  ignoreReturnCode: false,
  env: process.env,
};

export default (command, args = [], options = {}, stdout = '', stderr = '') => {
  // @TODO: error handling?
  // merge our options over the defaults
  options = merge({}, defaults, options);
  const {debug} = options;

  // birth
  const child = spawn(command, args, options);
  debug('running command pid=%o %o %o', child.pid, command, args);


  return mergePromise(child, async () => {
    return new Promise((resolve, reject) => {
      child.on('error', error => {
        debug('command pid=$o %o error %o', child.pid, command, error?.message);
        stderr += error?.message ?? error;
      });

      child.stdout.on('data', data => {
        debug('stdout %s', color.dim(data.toString().trim()));
        stdout += data;
      });

      child.stderr.on('data', data => {
        debug('stderr %s', color.dim(data.toString().trim()));
        stderr += data;
      });

      child.on('close', code => {
        debug('command pid=%o %o done with code %o', child.pid, command, code);
        // if code is non-zero and we arent ignoring then reject here
        if (code !== 0 && !options.ignoreReturnCode) {
          const error = new Error(stderr);
          error.code = code;
          reject(error);
        }

        // otherwise return
        resolve({stdout, stderr, code});
      });
    });
  });
};
