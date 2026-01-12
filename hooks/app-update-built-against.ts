
import _ from 'lodash';

// Update built against
const updateBuiltAgainst = (app, version = 'unknown') => {
  app.meta = _.merge({}, app.meta, {builtAgainst: version});
  return app.meta;
};

export default async (app, lando) => {
  lando.cache.set(app.metaCache, updateBuiltAgainst(app, app._config.version), {persist: true});
};
