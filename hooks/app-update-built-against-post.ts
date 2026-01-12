
import _ from 'lodash';
import updateBuiltAgainst from './app-update-built-against.js';
import rebuildTip from '../messages/rebuild-tip.js';

export default async (app, lando) => {
  if (!_.has(app.meta, 'builtAgainst')) updateBuiltAgainst(app, lando);
  if (app.meta.builtAgainst !== app._config.version) app.addMessage(rebuildTip);
};
