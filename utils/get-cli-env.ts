
import _ from 'lodash';

export default (more = {}) => _.merge({}, {
  PHP_MEMORY_LIMIT: '-1',
}, more);
