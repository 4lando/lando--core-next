#!/usr/bin/env bun

/**
 * Main CLI entrypoint for @lando/core
 * @name lando
 */

import dns from 'dns';
import fs from 'fs';
import path from 'path';
import {fileURLToPath} from 'url';
import _ from 'lodash';
import argv from '@lando/argv';
import Debug from 'debug';

import defaultConfig from '../utils/get-default-config';
import getApp from '../utils/get-app';
import getLandoFiles from '../utils/get-lando-files';
import lmerge from '../utils/legacy-merge';
import loadFile from '../utils/load-file';
import loadEnvars from '../utils/load-envars';
import isWslInterop from '../utils/is-wsl-interop';
import Cli from '../lib/cli';
import getTasks from '../utils/get-tasks';
import Lando from '../lib/lando';
import pjson from '../package.json';

// DNS must be set first to ensure IPv4 resolution order before any network operations
dns.setDefaultResultOrder('ipv4first');

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const id = path.basename(process.argv[1] ?? process.argv[0] ?? 'lando');

// Unset DEBUG to prevent it from toggling debugging inside lando; use LANDO_DEBUG instead
if (process.env.DEBUG) delete process.env.DEBUG;

if (process.env.LANDO_DEBUG) {
  const isEnabled = process.env.LANDO_DEBUG === '1' ||
    process.env.LANDO_DEBUG === 'true';
  const scope = isEnabled ? `${id}*` : process.env.LANDO_DEBUG;
  Debug.enable(scope);
}

if (argv.hasOption('--debug')) {
  Debug.enable(argv.getOption('--debug', {defaultValue: `${id}*`}));
}

// eslint-disable-next-line new-cap
const debug = Debug(id || 'lando');

debug('starting %o version %o runtime selector...', id, pjson.version);

// These envvars are kept for backwards compatibility but generally shouldn't be used
const LOGLEVELCONSOLE = process.env.LANDO_CORE_LOGLEVELCONSOLE || debug.enabled ? 4 : undefined;
const ENVPREFIX = process.env.LANDO_CORE_ENVPREFIX;
const USERCONFROOT = process.env.LANDO_CORE_USERCONFROOT;
const RUNTIME = process.env.LANDO_CORE_RUNTIME;

// "Minstrap" - get the MINIMAL config needed to determine runtime and bootstrap level
let config = defaultConfig({envPrefix: ENVPREFIX, runtime: RUNTIME, userConfRoot: USERCONFROOT});

for (const file of config.configSources) {
  config = lmerge(config, loadFile(file));
  debug('merged in additional config source from file %o', file);
}

if (config.envPrefix) {
  const data = loadEnvars(config.envPrefix);
  config = lmerge(config, data);
  debug('merged in additional config source from %o envvars with data %o', `${config.envPrefix}_*`, data);
}

debug('final assembled minconf is %O', config);

const {preLandoFiles, landoFile, postLandoFiles, userConfRoot} = config;
const landoFiles = getLandoFiles([preLandoFiles, [landoFile], postLandoFiles].flat(1));
const appConfig = (landoFiles.length > 0) ? getApp(landoFiles, userConfRoot) : {};

if (Object.keys(appConfig).length > 0) {
  debug('detected an app %o at %o', appConfig.name, path.dirname(landoFiles[0]));
}

const COREBASE = path.resolve(__dirname, '..');
const cli = new Cli(ENVPREFIX, LOGLEVELCONSOLE, USERCONFROOT, COREBASE, debug);

debug('starting lando with %o runtime using cli %o', 'v3', {ENVPREFIX, LOGLEVELCONSOLE, USERCONFROOT, COREBASE});

cli.checkPerms();

// Attach cache-related globals for downstream access
(process as any).lando = 'node';
(process as any).landoPlatform = isWslInterop() ? 'wsl' : process.platform;
(process as any).landoTaskCacheName = '_.tasks.cache';
(process as any).landoTaskCacheFile = path.join(cli.defaultConfig().userConfRoot, 'cache', (process as any).landoTaskCacheName);
(process as any).landoAppCacheFile = !_.isEmpty(appConfig) ? appConfig.composeCache : undefined;

// Invalidate app cache if recipe changed but recipe cache doesn't exist
if (appConfig.recipe && !fs.existsSync(appConfig.recipeCache)) {
  if (fs.existsSync((process as any).landoAppCacheFile)) fs.unlinkSync((process as any).landoAppCacheFile);
}

// Determine bootstrap level: APP if we have an app without cached compose, otherwise TASKS
const bsLevel = !_.isEmpty(appConfig) && !fs.existsSync((process as any).landoAppCacheFile) ? 'APP' : 'TASKS';

// Invalidate task cache if compose cache is missing (forces full rebuild)
if (bsLevel === 'APP' && !fs.existsSync(appConfig.composeCache)) {
  if (fs.existsSync((process as any).landoTaskCacheFile)) fs.unlinkSync((process as any).landoTaskCacheFile);
}

// Fast path: if task cache exists, run CLI directly without full bootstrap
if (fs.existsSync((process as any).landoTaskCacheFile)) {
  cli.run(getTasks(appConfig, cli.argv()), appConfig);
// Slow path: bootstrap lando to generate task cache (adds ~0.5s startup time)
} else {
  const lando = new Lando(cli.defaultConfig(appConfig));
  lando.cli = cli;
  lando.appConfig = appConfig;

  lando.bootstrap(bsLevel).then((lando: any) => {
    // APP level: init app (without engine) to generate app-specific task cache
    if (bsLevel === 'APP') {
      lando.getApp().init({noEngine: true}).then(() => cli.run(getTasks(appConfig, cli.argv()), appConfig));
    } else {
      cli.run(getTasks(appConfig, cli.argv()), appConfig);
    }
  });
}
