
import _ from 'lodash';
import updateBuiltAgainst from './app-update-built-against.js';

export default async (app, lando) => {
  if (!_.has(app.meta, 'builtAgainst')) {
    return lando.engine.list({project: app.project, all: true}).then(containers => {
      if (!_.isEmpty(containers)) updateBuiltAgainst(app, lando);
    });
  }
};
