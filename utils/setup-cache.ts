import Cache from '../lib/cache.js';

import path from 'path';

import {nanoid} from 'nanoid';

export default (log, config) => {
  const cache = new Cache({log, cacheDir: path.join(config.userConfRoot, 'cache')});
  if (!cache.get('id')) cache.set('id', nanoid(), {persist: true});
  config.user = cache.get('id');
  config.id = config.user;
  return cache;
};
