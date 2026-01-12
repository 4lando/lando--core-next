
import _ from 'lodash';

export default (services = {}) => _(services)
  .map((service, id) => _.merge({}, {id}, service))
  .map(service => ([service.id, service.appMount]))
  .fromPairs()
  .value();
