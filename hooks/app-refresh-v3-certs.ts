
import _ from 'lodash';
import serviceNotRunningError from '../messages/service-not-running-error.js';

export default async (app, lando) => {
  const buildServices = _.get(app, 'opts.services', app.services)
  .filter(service => app.servicesList
  .includes(service));

  app.log.verbose('refreshing certificates...', buildServices);
  app.events.on('post-start', 9999, () => lando.Promise.each(buildServices, service => {
    return app.engine.run({
      id: app.containers[service],
      cmd: 'mkdir -p /certs && /helpers/refresh-certs.sh > /certs/refresh.log',
      compose: app.compose,
      project: app.project,
      opts: {
        detach: true,
        mode: 'attach',
        user: 'root',
        services: [service],
      },
    })
    .catch(err => {
      app.addMessage(serviceNotRunningError(service), err);
    });
  }));
};
