#!/usr/bin/env bun

import dns from 'dns';
import fs from 'fs';
import path from 'path';
import {fileURLToPath} from 'url';
import _ from 'lodash';
import argv from '@lando/argv';
import {execute} from '@oclif/core';

import Debug from '../utils/debug.js';
import defaultConfig from '../utils/get-default-config.js';
import getApp from '../utils/get-app.js';
import getLandoFiles from '../utils/get-lando-files.js';
import lmerge from '../utils/legacy-merge.js';
import loadFile from '../utils/load-file.js';
import loadEnvars from '../utils/load-envars.js';
import isWslInterop from '../utils/is-wsl-interop.js';
import pjson from '../package.json';

dns.setDefaultResultOrder('ipv4first');

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const id = path.basename(process.argv[1] ?? process.argv[0] ?? 'lando');

if (process.env.DEBUG) delete process.env.DEBUG;

if (process.env.LANDO_DEBUG) {
  const isEnabled = process.env.LANDO_DEBUG === '1' || process.env.LANDO_DEBUG === 'true';
  const scope = isEnabled ? `${id}*` : process.env.LANDO_DEBUG;
  Debug.enable(scope);
}

if (argv.hasOption('--debug')) {
  Debug.enable(argv.getOption('--debug', {defaultValue: `${id}*`}) as string);
}

const debug = Debug(id || 'lando');
debug('starting %o version %o with OCLIF...', id, pjson.version);

const ENVPREFIX = process.env.LANDO_CORE_ENVPREFIX;
const USERCONFROOT = process.env.LANDO_CORE_USERCONFROOT;
const RUNTIME = process.env.LANDO_CORE_RUNTIME ? parseInt(process.env.LANDO_CORE_RUNTIME, 10) : undefined;

let config = defaultConfig({envPrefix: ENVPREFIX, runtime: RUNTIME, userConfRoot: USERCONFROOT});

for (const file of config.configSources as string[]) {
  config = lmerge(config, loadFile(file));
  debug('merged in additional config source from file %o', file);
}

if (config.envPrefix) {
  const data = loadEnvars(config.envPrefix as string);
  config = lmerge(config, data);
  debug('merged in additional config source from %o envvars', `${config.envPrefix}_*`);
}

debug('final assembled minconf is %O', config);

const {preLandoFiles, landoFile, postLandoFiles, userConfRoot} = config as Record<string, unknown>;
const landoFiles = (getLandoFiles as Function)(
  [preLandoFiles as string[], [landoFile as string], postLandoFiles as string[]].flat(1),
) as string[];
const appConfig = landoFiles.length > 0 ? getApp(landoFiles, userConfRoot as string) : {};

if (Object.keys(appConfig).length > 0) {
  debug('detected an app %o at %o', appConfig.name, path.dirname(landoFiles[0]));
}

(process as any).lando = 'bun';
(process as any).landoPlatform = isWslInterop() ? 'wsl' : process.platform;
(process as any).landoTaskCacheName = '_.tasks.cache';
(process as any).landoTaskCacheFile = path.join(userConfRoot as string, 'cache', (process as any).landoTaskCacheName);
(process as any).landoAppCacheFile = !_.isEmpty(appConfig) ? appConfig.composeCache : undefined;
(process as any).landoAppConfig = appConfig;

if (appConfig.recipe && !fs.existsSync(appConfig.recipeCache)) {
  if (fs.existsSync((process as any).landoAppCacheFile)) fs.unlinkSync((process as any).landoAppCacheFile);
}

const bsLevel = !_.isEmpty(appConfig) && !fs.existsSync((process as any).landoAppCacheFile) ? 'app' : 'tasks';

if (bsLevel === 'app' && !fs.existsSync(appConfig.composeCache)) {
  if (fs.existsSync((process as any).landoTaskCacheFile)) fs.unlinkSync((process as any).landoTaskCacheFile);
}

debug('bootstrap level determined as %o', bsLevel);

await execute({dir: path.join(__dirname, '..')});
