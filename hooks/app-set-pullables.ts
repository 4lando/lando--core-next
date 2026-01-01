
import _ from 'lodash';

export default async app => {
  // Determine local vs pullable services
  const whereats = _(_.get(app, 'config.services', {}))
    .map((data, service) => ({
      service,
      isLocal: _.has(data, 'overrides.build') || _.has(data, 'services.build') || _.get(data, 'api', 3) === 4,
    }))
    .value();

  // Set local and pullys for downstream concerns
  app.log.debug('determined pullable services', whereats);
  app.opts = _.merge({}, app.opts, {
    pullable: _(whereats).filter(service => !service.isLocal).map('service').value(),
    local: _(whereats).filter(service => service.isLocal).map('service').value(),
  });
};
