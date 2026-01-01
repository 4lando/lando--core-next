
import _ from 'lodash';

export default versions => _(versions)
  .map(version => (version.split('.')[2] === 'x') ? _.slice(version.split('.'), 0, 2).join('.') : version)
  .value();
