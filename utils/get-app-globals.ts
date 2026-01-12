import toObject from './to-object.js';

export default app => toObject(app.services, {
  networks: {default: {}},
  environment: app.env,
  env_file: app.envFiles,
  labels: app.labels,
  volumes: [`${app._config.userConfRoot}/scripts:/helpers`],
});
