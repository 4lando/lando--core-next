import _ from 'lodash';
import {color} from 'listr2';

// Re-exports for backwards compatibility
import slugify from '../utils/slugify.js';
import dockerComposify from '../utils/docker-composify.js';
import dumpComposeData from '../utils/dump-compose-data.js';
import getAppMounts from '../utils/get-app-mounts.js';
import getCliEnv from '../utils/get-cli-env.js';
import getAppGlobals from '../utils/get-app-globals.js';
import getContainerId from '../utils/get-container-id.js';
import getAppInfoDefaults from '../utils/get-app-info-defaults.js';
import getAppServices from '../utils/get-app-services.js';
import getUser from '../utils/get-user.js';
import loadComposeFiles from '../utils/load-compose-files.js';
import makeExecutable from '../utils/make-executable.js';
import moveConfig from '../utils/move-config.js';
import normalizer from '../utils/normalizer.js';
import shellEscape from '../utils/shell-escape.js';
import toLandoContainer from '../utils/to-lando-container.js';
import toObject from '../utils/to-object.js';
import normalizeFiles from '../utils/normalize-files.js';
import debugShim from '../utils/debug-shim.js';
import downloadX from '../utils/download-x.js';
import getAxios from '../utils/get-axios.js';
import getOctokit from '../utils/get-octokit.js';
import getUserShell from '../utils/get-user-shell.js';
import getUserShellProfile from '../utils/get-user-shell-profile.js';
import isLteVersion from '../utils/is-lte-version.js';
import legacyMerge from '../utils/legacy-merge.js';
import mergeArrays from '../utils/merge-arrays.js';
import mergePromise from '../utils/merge-promise.js';
import merge from '../utils/merge.js';
import readFile from '../utils/read-file.js';
import remove from '../utils/remove.js';
import runCommand from '../utils/run-command.js';
import runElevated from '../utils/run-elevated.js';
import runPowershellScript from '../utils/run-powershell-script.js';
import writeFile from '../utils/write-file.js';
import jsYaml from 'js-yaml';
import lodash from 'lodash';
import semver from 'semver';

// @NOTE: this file exists for backwards compatibility

const getHealth = (info, data) => {
  // any error should be red
  if (info?.error) return color.red(data);
  // image build failures should be red
  if (info?.state?.IMAGE === 'BUILD FAILURE') return color.red(data);
  // failed healthchecks are yellow
  if (info?.healthy === false) return color.yellow(data);
  // otherwise green will do
  return color.green(data);
};

/*
 * Returns a CLI table with app start metadata info
 */
const startTable = (app, {legacyScanner = false} = {}) => {
  const data = {
    name: app.name,
    location: app.root,
    services: _(app.info)
      .map(info => getHealth(info, info.service))
      .values()
      .join(', '),
  };
  const urls = {};

  // Categorize and colorize URLS if and as appropriate
  // add legacy scanner info if appropriate
  if (legacyScanner) {
    _.forEach(app.info, info => {
      if (_.has(info, 'urls') && !_.isEmpty(info.urls)) {
        urls[info.service] = _.filter(app.urls, item => {
          item.theme = color[item.color](item.url);
          return _.includes(info.urls, item.url);
        });
      }
    });

    // Add service URLS
    _.forEach(urls, (items, service) => {
      data[service + ' urls'] = _.map(items, 'theme');
    });

  // add placeholder URLS for non le
  } else {
    data.urls = '';
  }

  // Return data
  return data;
};

/*
 * Helper to parse metrics data
 */
const metricsParse = app => {
  // Metadata to report.
  const data = {
    app: _.get(app, 'id', 'unknown'),
    type: _.get(app, 'config.recipe', 'none'),
  };

  // build an array of services to send as well if we can, prefer info since it has combined v3 and v4 stuff
  if (!_.isEmpty(app.info)) {
    data.services = _.map(_.get(app, 'info'), service => _.pick(service, ['api', 'type', 'version']));

  // otherwise lets use the older config.services
  } else if (_.has(app, 'config.services')) {
    data.services = _.map(_.get(app, 'config.services'), service => service.type);
  }

  // Return
  return data;
};

export {
  // @TODO: start table needs to be removed eventually
  // @TODO: parseMetrics needs to go in a plugin eventually
  metricsParse,
  startTable,

  // these all stay for backwards compatibility
  slugify as appMachineName,
  dockerComposify,
  dumpComposeData,
  getAppMounts,
  getCliEnv as getCliEnvironment,
  getAppGlobals as getGlobals,
  getContainerId as getId,
  getAppInfoDefaults as getInfoDefaults,
  getAppServices as getServices,
  getUser,
  loadComposeFiles,
  makeExecutable,
  moveConfig,
  normalizer,
  shellEscape,
  toLandoContainer,
  toObject,
  normalizeFiles as validateFiles,

  // these are new and useful v4 things
  debugShim,
  downloadX,
  getAxios,
  getOctokit,
  getUserShell,
  getUserShellProfile,
  isLteVersion as isVersionLte,
  legacyMerge,
  mergeArrays,
  mergePromise,
  merge,
  readFile,
  remove,
  runCommand,
  runElevated,
  runPowershellScript as runPowerShell,
  slugify,
  writeFile,
};

// Library getters for backwards compatibility
export const getJsYaml = () => jsYaml;
export const getLodash = () => lodash;
export const getSemver = () => semver;

// Default export for backwards compatibility with CommonJS-style imports
export default {
  metricsParse,
  startTable,
  appMachineName: slugify,
  dockerComposify,
  dumpComposeData,
  getAppMounts,
  getCliEnvironment: getCliEnv,
  getGlobals: getAppGlobals,
  getId: getContainerId,
  getInfoDefaults: getAppInfoDefaults,
  getServices: getAppServices,
  getUser,
  loadComposeFiles,
  makeExecutable,
  moveConfig,
  normalizer,
  shellEscape,
  toLandoContainer,
  toObject,
  validateFiles: normalizeFiles,
  debugShim,
  downloadX,
  getAxios,
  getOctokit,
  getUserShell,
  getUserShellProfile,
  isVersionLte: isLteVersion,
  legacyMerge,
  mergeArrays,
  mergePromise,
  merge,
  readFile,
  remove,
  runCommand,
  runElevated,
  runPowerShell: runPowershellScript,
  slugify,
  writeFile,
  getJsYaml: () => jsYaml,
  getLodash: () => lodash,
  getSemver: () => semver,
};
