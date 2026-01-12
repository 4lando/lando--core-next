import dumpComposeData from './dump-compose-data.js';
import dockerComposify from './docker-composify.js';

import _ from 'lodash';
import path from 'path';

export default (lando, options) => {
  // Handle all the compose stuff
  const LandoInit = lando.factory.get('_init');
  const initData = new LandoInit(
    lando.config.userConfRoot,
    lando.config.home,
    options.destination,
    _.cloneDeep(lando.config.appEnv),
    _.cloneDeep(lando.config.appLabels),
    _.get(options, 'initImage', 'devwithlando/util:4'),
  );
  const initDir = path.join(lando.config.userConfRoot, 'init', options.name);
  const initFiles = dumpComposeData(initData, initDir);
  // Start to build out some propz and shiz
  const project = `${lando.config.product}init` + dockerComposify(options.name);
  const separator = lando.config.orchestratorSeparator;
  // Return
  return {
    id: [`${project}${separator}init${separator}1`],
    project,
    user: 'www-data',
    compose: initFiles,
    remove: false,
  };
};
