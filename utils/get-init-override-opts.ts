import getInitAuxOpts from './get-init-aux-opts.js';

import _ from 'lodash';

const getConfig = (data = [], name) => _.find(data, {name});

export default (inits = [], recipes = [], sources = []) => {
  const opts = getInitAuxOpts(recipes);
  _.forEach(opts, (opt, key) => {
    const isRec = key === 'recipe';
    // NOTE: when seems like the most relevant override here, should we consider adding more?
    // are we restricted by access to the answers hash or when these things actually run?
    _.forEach(['when'], prop => {
      const overrideFunc = answers => {
        const config = isRec ? getConfig(sources, answers.source) : getConfig(inits, answers.recipe);
        if (_.has(config, `overrides.${key}.${prop}`) && _.isFunction(config.overrides[key][prop])) {
          return config.overrides[key][prop](answers);
        } else {
          return opt.interactive[prop](answers);
        }
      };
      opts[key] = _.merge({}, {interactive: _.set({}, prop, overrideFunc)});
    });
  });
  return opts;
};
