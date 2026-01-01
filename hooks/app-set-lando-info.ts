
import _ from 'lodash';
import toObject from '../utils/to-object.js';

export default async app => {
  const info = toObject(_.map(app.info, 'service'), {});
  _.forEach(info, (value, key) => {
    info[key] = _.find(app.info, {service: key});
  });
  app.log.verbose('setting LANDO_INFO...');
  app.env.LANDO_INFO = JSON.stringify(info);
};
