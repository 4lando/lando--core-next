
import _ from 'lodash';

export default async (app, lando) => {
  return lando.engine.list({project: app.project, all: true}).then(data => {
    if (_.isEmpty(data)) {
      lando.cache.remove(app.v4.preLockfile);
      lando.cache.remove(app.v4.postLockfile);
      app.log.debug('removed v4 build locks');
    }
  });
};
