import getToolingDefaultsFn from './get-tooling-defaults.js';
import buildDockerExec from './build-docker-exec.js';
import buildToolingRunner from './build-tooling-runner.js';
import parseToolingConfig from './parse-tooling-config.js';

import _ from 'lodash';

export default (config, injected) => {
  // Get our defaults and such
  const getToolingDefaults = getToolingDefaultsFn;
  const {name, app, appMount, cmd, describe, dir, env, options, service, stdio, user} = getToolingDefaults(config);

  // add debug stuff if debuggy
  env.DEBUG = injected.debuggy ? '1' : '';
  env.LANDO_DEBUG = injected.debuggy ? '1' : '';

  // get the service api
  const sapis = config?.app?.sapis ?? {};

  // Handle dynamic services and passthrough options right away
  // Get the event name handler
  const eventName = name.split(' ')[0];
  const run = answers => injected.Promise.try(() => (_.isEmpty(app.compose)) ? app.init() : true)
    // Kick off the pre event wrappers
    .then(() => app.events.emit(`pre-${eventName}`, config, answers))
    // Get an interable of our commandz
    .then(() => _.map(parseToolingConfig(cmd, service, options, answers, sapis)))
    // Build run objects
    .map(({command, service}) => buildToolingRunner(app, command, service, user, env, dir, appMount))
    // Try to run the task quickly first and then fallback to compose launch
    .each(runner => buildDockerExec(injected, stdio, runner).catch(execError => {
      return injected.engine.isRunning(runner.id).then(isRunning => {
        if (!isRunning) {
          return injected.engine.run(runner).catch(composeError => {
            composeError.hide = true;
            throw composeError;
          });
        } else {
          execError.hide = true;
          throw execError;
        }
      });
    }))
    // Post event
    .then(() => app.events.emit(`post-${eventName}`, config, answers));

  // Return our tasks
  return {
    command: name,
    describe,
    run,
    options,
  };
};
