
import _ from 'lodash';

// adds required methods to ensure the lando v3 debugger can be injected into v4 things
export default app => _(app.services)
  .map(service => ({service, urls: [], type: 'docker-compose', healthy: 'unknown'}))
  .map(service => _.merge({}, service, _.find(app.info, {service: service.service})))
  .value();
