
import _ from 'lodash';

import dumpComposeData from '../utils/dump-compose-data.js';

export default async app => {
  _.forEach(app.v4.services.map(service => service.id), id => {
    // remove v3 app mount
    const mounts = _.find(app.composeData, compose => compose.id === 'mounts');
    mounts.data = mounts.data.map(datum => {
      if (datum.services && datum.services[id]) datum.services[id] = {volumes: []};
      return datum;
    });

    // remove v3 scripts mounts
    // @TODO: other globals we should blow away?
    const globals = _.find(app.composeData, compose => compose.id === 'globals');
    globals.data = globals.data.map(datum => {
      if (datum.services && datum.services[id]) datum.services[id] = {...datum.services[id], volumes: []};
      return datum;
    });
  });

  // Log
  app.initialized = false;
  app.compose = dumpComposeData(app.composeData, app._dir);
  app.log.verbose('v4 app is ready!');
  app.initialized = true;
  return app.events.emit('ready-v4');
};
