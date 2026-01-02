import _ from 'lodash';
import path from 'path';
import {nanoid} from 'nanoid';

// Utils imports
import debugShim from './utils/debug-shim';
import getAppInfoDefaults from './utils/get-app-info-defaults';
import getMounts from './utils/get-mounts';
import getServiceApis from './utils/get-service-apis';

// Hooks imports
import appAdd2Landonet from './hooks/app-add-2-landonet';
import appAddHealthchecks from './hooks/app-add-healthchecks';
import appAddHostnames from './hooks/app-add-hostnames';
import appAddPathInfo from './hooks/app-add-path-info';
import appAddProxy2Landonet from './hooks/app-add-proxy-2-landonet';
import appAddProxyInfo from './hooks/app-add-proxy-info';
import appAddRecipes from './hooks/app-add-recipes';
import appAddTooling from './hooks/app-add-tooling';
import appAddUpdatesInfo from './hooks/app-add-updates-info';
import appAddUrlScans from './hooks/app-add-url-scans';
import appAddV3Services from './hooks/app-add-v3-services';
import appAddV4Services from './hooks/app-add-v4-services';
import appCheckDockerCompat from './hooks/app-check-docker-compat';
import appCheckForUpdates from './hooks/app-check-for-updates';
import appCheckLegacyPlugins from './hooks/app-check-legacy-plugins';
import appCheckSshKeys from './hooks/app-check-ssh-keys';
import appCheckV4ServiceRunning from './hooks/app-check-v4-service-running';
import appFindLocalhosts from './hooks/app-find-localhosts';
import appGenerateV3Certs from './hooks/app-generate-v3-certs';
import appInitProxy from './hooks/app-init-proxy';
import appLoadLegacySharing from './hooks/app-load-legacy-sharing';
import appOverrideToolingDefaults from './hooks/app-override-tooling-defaults';
import appPurgeComposeCache from './hooks/app-purge-compose-cache';
import appPurgeComposeDir from './hooks/app-purge-compose-dir';
import appPurgeMetadataCache from './hooks/app-purge-metadata-cache';
import appPurgeRecipeCache from './hooks/app-purge-recipe-cache';
import appPurgeV3BuildLocks from './hooks/app-purge-v3-build-locks';
import appPurgeV4BuildLocks from './hooks/app-purge-v4-build-locks';
import appRefreshV3Certs from './hooks/app-refresh-v3-certs';
import appResetOrchestrator from './hooks/app-reset-orchestrator';
import appRunEvents from './hooks/app-run-events';
import appRunHealthchecks from './hooks/app-run-healthchecks';
import appRunLegacyScanner from './hooks/app-run-legacy-scanner';
import appRunV3BuildSteps from './hooks/app-run-v3-build-steps';
import appRunV3SecondarySweep from './hooks/app-run-v3-secondary-sweep';
import appRunV4BuildSteps from './hooks/app-run-v4-build-steps';
import appRunV4DestroyService from './hooks/app-run-v4-destroy-service';
import appSetBindAddress from './hooks/app-set-bind-address';
import appSetComposeCache from './hooks/app-set-compose-cache';
import appSetLandoInfo from './hooks/app-set-lando-info';
import appSetPortforwards from './hooks/app-set-portforwards';
import appSetPullables from './hooks/app-set-pullables';
import appSetV4ComposeCache from './hooks/app-set-v4-compose-cache';
import appShuffleLocals from './hooks/app-shuffle-locals';
import appStartProxy from './hooks/app-start-proxy';
import appUpdateBuiltAgainst from './hooks/app-update-built-against';
import appUpdateBuiltAgainstPost from './hooks/app-update-built-against-post';
import appUpdateBuiltAgainstPre from './hooks/app-update-built-against-pre';
import appV4Ready from './hooks/app-v4-ready';

// Helper to set the LANDO_LOAD_KEYS var
const getKeys = (keys = true) => {
  if (_.isArray(keys)) return keys.join(' ');
  return keys.toString();
};

export default async (app, lando) => {
  // Compose cache key
  app.composeCache = `${app.name}.compose.cache`;
  // recipe cache key
  app.recipeCache = `${app.name}.recipe.cache`;
  // Build step locl files
  app.preLockfile = `${app.name}.build.lock`;
  app.postLockfile = `${app.name}.post-build.lock`;
  // add compose cache updated
  app.updateComposeCache = () => {
    lando.cache.set(app.composeCache, {
      allServices: app.allServices,
      compose: app.compose,
      containers: app.containers,
      info: _.cloneDeep(app.info).map(service => ({...service, hostname: [], urls: []})),
      name: app.name,
      overrides: {
        tooling: app._coreToolingOverrides,
      },
      primary: app._defaultService,
      project: app.project,
      root: app.root,
      sapis: getServiceApis(app),
    }, {persist: true});
  };

  // Add v4 stuff to the app object
  app.v4 = {};
  app.v4._debugShim = debugShim(app.log);
  app.v4._dir = path.join(lando.config.userConfRoot, 'v4', `${app.name}-${app.id}`);
  app.v4.preLockfile = `${app.name}.v4.build.lock`;
  app.v4.postLockfile = `${app.name}.v4.build.lock`;
  app.v4.services = [];
  app.v4.composeCache = `${app.name}.compose.cache`;

  // Add compose cache v4 updaters
  // add compose cache updated
  app.v4.updateComposeCache = () => {
    lando.cache.set(app.v4.composeCache, {
      allServices: app.allServices,
      compose: app.compose,
      containers: app.containers,
      info: _.cloneDeep(app.info).map(service => ({...service, hostname: [], urls: []})),
      name: app.name,
      mounts: getMounts(_.get(app, 'v4.services', {})),
      primary: app._defaultService,
      project: app.project,
      root: app.root,
      sapis: getServiceApis(app),
      overrides: {
        tooling: app._coreToolingOverrides,
      },

    }, {persist: true});
  };

  // front load top level networks
  app.v4.addNetworks = (data = {}) => {
    app.add({
      id: `v4-networks-${nanoid()}`,
      info: {},
      data: [{networks: data}],
    }, true);
  };
  // front load top level volumes
  app.v4.addVolumes = (data = {}) => {
    app.add({
      id: `v4-volumes-${nanoid()}`,
      info: {},
      data: [{volumes: data}],
    }, true);
  };

  // load in and parse recipes
  app.events.on('pre-init', 4, async () => await appAddRecipes(app, lando));

  // load in and parse v3 services
  app.events.on('pre-init', async () => await appAddV3Services(app, lando));

  // load in and parse v4 services
  app.events.on('pre-init', async () => await appAddV4Services(app, lando));

  // initialize proxy stuff
  app.events.on('pre-init', async () => await appInitProxy(app, lando));

  // add in hostname
  app.events.on('post-init', 1, async () => await appAddHostnames(app, lando));

  // run v3 build steps
  app.events.on('post-init', async () => await appRunV3BuildSteps(app, lando));

  // run v4 build steps
  app.events.on('post-init', async () => await appRunV4BuildSteps(app, lando));

  // refresh all out v3 certs
  app.events.on('post-init', async () => await appRefreshV3Certs(app, lando));

  // Run a secondary user perm sweep on services that cannot run as root eg mysql
  app.events.on('post-init', async () => await appRunV3SecondarySweep(app, lando));

  // Assess our key situation so we can warn users who may have too many
  app.events.on('post-init', async () => await appCheckSshKeys(app, lando));

  // Flag legacy plugins
  app.events.on('post-init', async () => await appCheckLegacyPlugins(app, lando));

  // Add tooling if applicable
  app.events.on('post-init', async () => await appAddTooling(app, lando));

  // add proxy info as needed
  app.events.on('post-init', async () => await appAddProxyInfo(app, lando));

  // Collect info so we can inject LANDO_INFO
  // @NOTE: this is not currently the full lando info because a lot of it requires the app to be on
  app.events.on('post-init', 10, async () => await appSetLandoInfo(app, lando));

  // Analyze an apps compose files so we can set the default bind addres correctly
  // @TODO: i feel like there has to be a better way to do this than this mega loop right?
  app.events.on('post-init', 9999, async () => await appSetBindAddress(app, lando));

  // Add localhost info to our containers if they are up
  app.events.on('post-init-engine', async () => await appFindLocalhosts(app, lando));

  // override default tooling commands if needed
  app.events.on('ready', 1, async () => await appOverrideToolingDefaults(app, lando));

  // set tooling compose cache
  app.events.on('ready', async () => await appSetComposeCache(app, lando));

  // v4 parts of the app are ready
  app.events.on('ready', 6, async () => await appV4Ready(app, lando));

  // this is a gross hack we need to do to reset the engine because the lando 3 runtime has no idea
  app.events.on('ready-engine', 1, async () => await appResetOrchestrator(app, lando));

  // Discover portforward true info
  app.events.on('ready-engine', async () => await appSetPortforwards(app, lando));

  // Save a compose cache every time the app is ready, we have to duplicate this for v4 because we modify the
  // composeData after the v3 app.ready event
  app.events.on('ready-v4', async () => await appSetV4ComposeCache(app, lando));

  // Otherwise set on rebuilds
  // NOTE: We set this pre-rebuild because post-rebuild runs after post-start because you would need to
  // do two rebuilds to remove the warning since appWarning is already set by the time we get here.
  // Running pre-rebuild ensures the warning goes away but concedes a possible warning tradeoff between
  // this and a build step failure
  app.events.on('pre-rebuild', async () => await appUpdateBuiltAgainst(app, lando));

  // Determine pullable and locally built images
  app.events.on('pre-rebuild', async () => await appSetPullables(app, lando));

  // we need to temporarily set app.compose to be V3 only and then restore it post-rebuild
  // i really wish thre was a better way to do this but alas i do not think there is
  app.events.on('pre-rebuild', 10, async () => await appShuffleLocals(app, lando));

  // start up proxy
  app.events.on('pre-start', 1, async () => await appStartProxy(app, lando));

  // Check for updates if the update cache is empty
  app.events.on('pre-start', 1, async () => await appCheckForUpdates(app, lando));

  // Generate certs for v3 SSL services as needed
  app.events.on('pre-start', 2, async () => await appGenerateV3Certs(app, lando));

  // If the app already is installed but we can't determine the builtAgainst, then set it to something bogus
  app.events.on('pre-start', async () => await appUpdateBuiltAgainstPre(app, lando));

  // add healthchecks
  app.events.on('post-start', 1, async () => await appAddHealthchecks(app, lando));

  // add proxy 2 landonet
  app.events.on('post-start', 1, async () => await appAddProxy2Landonet(app, lando));

  // add 2 landonet
  app.events.on('post-start', 1, async () => await appAdd2Landonet(app, lando));

  // run healthchecks
  app.events.on('post-start', 2, async () => await appRunHealthchecks(app, lando));

  // Add path info/shellenv tip if needed
  app.events.on('post-start', async () => await appAddUpdatesInfo(app, lando));

  // add proxy info as needed
  app.events.on('post-start', async () => await appAddProxyInfo(app, lando));

  // Add update tip if needed
  app.events.on('post-start', async () => await appAddPathInfo(app, lando));

  // If we don't have a builtAgainst already then we must be spinning up for the first time and its safe to set this
  app.events.on('post-start', async () => await appUpdateBuiltAgainstPost(app, lando));

  // Add localhost info to our containers if they are up
  app.events.on('post-start', async () => await appFindLocalhosts(app, lando));

  // Check for docker compat warnings and surface them nicely as well
  app.events.on('post-start', async () => await appCheckDockerCompat(app, lando));

  // throw service not start errors
  app.events.on('post-start', 1, async () => await appCheckV4ServiceRunning(app, lando));

  // add app url scanning
  app.events.on('post-start', 10, async () => await appAddUrlScans(app, lando));

  // Reset app info on a stop, this helps prevent wrong/duplicate information being reported on a restart
  app.events.on('post-stop', async () => getAppInfoDefaults(app));

  // remove v3 build locks
  app.events.on('post-uninstall', async () => await appPurgeV3BuildLocks(app, lando));

  // remove v4 build locks
  app.events.on('post-uninstall', async () => await appPurgeV4BuildLocks(app, lando));

  // remove compose cache
  app.events.on('post-uninstall', async () => await appPurgeComposeCache(app, lando));

  // remove tooling cache
  app.events.on('post-uninstall', async () => await appPurgeRecipeCache(app, lando));

  // Remove meta cache on destroy
  app.events.on('post-destroy', async () => await appPurgeMetadataCache(app, lando));

  // Run v4 service destroy methods
  app.events.on('post-destroy', async () => await appRunV4DestroyService(app, lando));

  // remove compose cache
  app.events.on('post-destroy', 9999, async () => await appPurgeComposeCache(app, lando));

  // remove compose cache directory
  app.events.on('post-destroy', 9999, async () => await appPurgeComposeDir(app, lando));

  // process events
  if (!_.isEmpty(_.get(app, 'config.events', []))) {
    _.forEach(app.config.events, (cmds, event) => {
      app.events.on(event, 9999, async data => await appRunEvents(app, lando, cmds, data, event));
    });
  }

  // LEGACY URL Scanner urls
  if (_.get(lando, 'config.scanner', true) === 'legacy') {
    app.events.on('post-start', 10, async () => await appRunLegacyScanner(app, lando));
  }

  // legacy sharing stuff
  await appLoadLegacySharing(app, lando);

  // REturn defualts
  return {
    env: {
      LANDO_APP_PROJECT: app.project,
      LANDO_APP_NAME: app.name,
      LANDO_APP_ROOT: app.root,
      LANDO_APP_ROOT_BIND: app.root,
      LANDO_APP_COMMON_NAME: _.truncate(app.project, {length: 64}),
      LANDO_LOAD_KEYS: getKeys(_.get(app, 'config.keys')),
      BITNAMI_DEBUG: 'true',
    },
    labels: {
      'io.lando.landofiles': app.configFiles.map(file => path.basename(file)).join(','),
      'io.lando.root': app.root,
      'io.lando.src': app.configFiles.join(','),
      'io.lando.http-ports': '80,443',
    },
  };
};
