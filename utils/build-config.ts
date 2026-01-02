import semverMajor from 'semver/functions/major';
import getComposeX from './get-compose-x.js';
import loadConfigFiles from './load-config-files.js';
import loadEnv from './load-env.js';
import loadEnvPluginConfig from './load-env-plugin-config.js';
import getConfigDefaults from './get-config-defaults.js';
import getEngineConfig from './get-engine-config.js';
import getOclifCacheDir from './get-cache-dir.js';
import stripEnv from './strip-env.js';
import semverValid from 'semver/functions/valid';
import legacyMerge from './legacy-merge.js';
import hasher from 'object-hash';

import _ from 'lodash';
import fs from 'fs';
import path from 'path';

// ESM equivalent of __dirname
const __dirname = path.dirname(new URL(import.meta.url).pathname);

/*
 * Converts landofile things into a configsource
 */
const parseLandofileConfig = (config = {}) => ({
  data: _.pickBy(config, (value, key) => {
    return _.includes(['plugins', 'pluginDirs'], key) && !_.isEmpty(value);
  }),
  file: config.configFiles[0],
  landoFile: true,
});

export default options => {
  // Use the legacy merge function
  const lmerge = legacyMerge;

  // Start building the config
  let config = lmerge(getConfigDefaults(options), options);

  // add the core config.yaml as a config source if we have it, ideally splice it in after the cli config
  // but if we cant then just put it at the beginning
  if (fs.existsSync(path.resolve(__dirname, '..', 'config.yml'))) {
    const splicedex = _.findIndex(config.configSources, element => _.endsWith(element, '/cli/config.yml')) || 0;
    config.configSources.splice(splicedex + 1, 0, path.resolve(__dirname, '..', 'config.yml'));
  }

  // Add in relevant Landofile config to config sources
  // @NOTE: right now this is pretty limited and mostly just so we can accelerate the breakup of the repo
  // Lando 4 will allow all non-bootstrap/compiletime config to be overridden in Landofiles'
  if (!_.isEmpty(config.landoFileConfig)) {
    config.configSources.push(parseLandofileConfig(config.landoFileConfig));
  }

  // If we have configSources let's merge those in as well
  if (!_.isEmpty(config.configSources)) {
    config = lmerge(config, loadConfigFiles(config.configSources));
  }

  // @TODO: app plugin dir gets through but core yml does not?
  // If we have an envPrefix set then lets merge that in as well
  if (_.has(config, 'envPrefix')) {
    config = lmerge(config, loadEnv(config.envPrefix));
  }

  // special handling for LANDO_PLUGIN_CONFIG
  if (_.keys(config, 'envPrefix')) {
    config = lmerge(config, loadEnvPluginConfig(config.envPrefix));
  }

  // Add some final computed properties to the config
  config.instance = hasher(config.userConfRoot);

  // Strip all DOCKER_ envars
  config.env = stripEnv('DOCKER_');
  // Set up the default engine config if needed
  config.engineConfig = getEngineConfig(config);
  // Strip all COMPOSE_ envvars
  config.env = stripEnv('COMPOSE_');
  // Disable docker CLI_HINTS
  config.env.DOCKER_CLI_HINTS = false;

  // if composeBin is set and orchestratorBin is not set then set one to the other
  if (config.composeBin && !config.orchestratorBin) config.orchestratorBin = config.composeBin;

  // If orchestratorBin is set, is an absolute path and exists then unset orchestratorVersion and rely on this alone
  if (typeof config.orchestratorBin === 'string'
    && path.isAbsolute(config.orchestratorBin)
    && fs.existsSync(config.orchestratorBin)) {
    delete config.orchestratorVersion;
  // Otherwise remove orchestratorBin and rely on orchestratorVersion alone
  } else {
    delete config.orchestratorBin;
  }

  // if orchestrator is not a valid version then remove it and try to use a system provided orchestartor
  if (semverValid(config.orchestratorVersion) === null) {
    config.orchestratorBin = getComposeX(config);
    delete config.orchestratorVersion;
  }

  // if we still have an orchestrator version at this point lets try to suss out its major version
  if (config.orchestratorVersion && semverValid(config.orchestratorVersion)) {
    config.orchestratorMV = semverMajor(config.orchestratorVersion);
    config.setup.orchestrator = config.setup.orchestrator ?? config.orchestratorVersion;
  }

  // Add some docker compose protection on windows
  if (process.platform === 'win32') config.env.COMPOSE_CONVERT_WINDOWS_PATHS = 1;
  // Extend the dockercompose timeout limit for future mutagen things
  config.env.COMPOSE_HTTP_TIMEOUT = 300;
  // If orchestratorSeparator is set to '-' and we are using docker-compose 2 then allow that
  config.env.COMPOSE_COMPATIBILITY = config.orchestratorSeparator === '_';
  // config.env.COMPOSE_ANSI='always';

  // Get hyperdrive lando config file location
  config.hconf = path.join(getOclifCacheDir(config.hyperdrive), `${config.product}.json`);
  // Return the config
  return config;
};

