
import _ from 'lodash';

export default (keys, data = {}) => _(keys)
  .map(() => data)
  .map((service, index) => _.set({}, keys[index], service))
  .thru(services => _.reduce(services, (sum, service) => _.merge(sum, service), {}))
  .value();
