// Modules
import _ from 'lodash';
import fs from 'fs';
import path from 'path';
import Enquirer from 'enquirer';
import {Listr} from 'listr2';
import createDebug from 'debug';
import isInteractive from 'is-interactive';

// Create debug logger for task runner
const taskRunnerDebug = createDebug('task-runner');

// adds required methods to ensure the lando v3 debugger can be injected into v4 things
export default async (tasks, {
  ctx = {},
  fallbackRenderer = 'simple',
  fallbackRendererOptions = {},
  renderer = 'lando',
  rendererForce = false,
  rendererOptions = {},
  listrOptions = {},
} = {}) => {
  // attempt to reset the renderer if its a string and has a renderer we can load
  if (typeof renderer === 'string' && fs.existsSync(path.resolve(import.meta.dirname, '..', 'renderers', `${renderer}.js`))) {
    renderer = (await import(path.resolve(import.meta.dirname, '..', 'renderers', `${renderer}.js`))).default;
  }
  // ditto for fallback renderer
  if (typeof fallbackRenderer === 'string' && fs.existsSync(path.resolve(import.meta.dirname, '..', 'renderers', `${fallbackRenderer}.js`))) { // eslint-disable-line max-len
    fallbackRenderer = (await import(path.resolve(import.meta.dirname, '..', 'renderers', `${fallbackRenderer}.js`))).default;
  }

  // if renderer force is on then make sure our fallback is just the normal renderer
  if (rendererForce === true) {
    fallbackRenderer = renderer;
    fallbackRendererOptions = rendererOptions;
  }

  // some sitautions just need the bare minimum
  if (process?.env?.TERM === 'dumb') renderer = 'simple';
  if (process?.env?.CI && !isInteractive()) renderer = 'simple';

  const defaults = {
    ctx: {data: {}, errors: [], results: [], skipped: 0, ran: 0, total: 0},
    concurrent: true,
    collectErrors: true,
    exitOnError: false,
    fallbackRenderer,
    fallbackRendererOptions,
    registerSignalListeners: false,
    renderer,
    rendererOptions: {
      log: taskRunnerDebug,
      collapseSubtasks: false,
      suffixRetries: false,
      showErrorMessage: true,
      taskCount: Array.isArray(tasks) ? tasks.length : 0,
    },
    showErrorMessage: true,
  };

  // construct the runner
  const runner = new Listr(tasks, _.merge({}, defaults, {
    ctx,
    injectWrapper: {
      enquirer: new Enquirer(),
    },
    ...listrOptions,
    rendererOptions,
  }));

  // if we got nothing to run then return the ctx
  if (!Array.isArray(tasks) || tasks.length === 0) return runner.options.ctx;

  // also add the runner to ctx so we can access other tasks and stuff
  runner.options.ctx.runner = runner;
  runner.options.ctx.total = Array.isArray(runner.tasks) ? runner.tasks.length : 0;

  // get results
  const results = await runner.run();

  // update results and then return
  results.skipped = tasks.filter(task => !task.enabled).length;
  results.ran = tasks.filter(task => task.enabled).length;
  // remove the runner from the results
  // @NOTE: is this a good idea?
  delete results.runner;
  return results;
};

