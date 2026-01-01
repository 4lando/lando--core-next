
import getComposeX from '../utils/get-compose-x.js';
import setupEngine from '../utils/setup-engine.js';

export default async (app, lando) => {
  // if we dont have an orchestrator bin yet then discover it
  if (!lando.config.orchestratorBin) lando.config.orchestratorBin = getComposeX(lando.config);

  // because the entire lando 3 runtime was made in a bygone era when we never dreamed of doing stuff like this
  // we need this workaround
  if (lando._bootstrapLevel >= 3 && !app.engine.composeInstalled) {
    app.engine = setupEngine(
      lando.config,
      lando.cache,
      lando.events,
      app.log,
      app.shell,
      lando.config.instance,
    );
  }

  // log our sitch
  app.log.debug('using docker-compose %s', lando.config.orchestratorBin);
};
