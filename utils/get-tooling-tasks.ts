
import _ from 'lodash';

export default (config, app) => _(config)
  .map((task, name) => _.merge({}, task, {app, name}))
  .filter(task => _.isObject(task))
  .value();
