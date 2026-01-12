
// l337-v4 uses CommonJS - keep require until components/ is converted
const L337V4 = require('../components/l337-v4');

export default async lando => {
  lando.factory.registry.unshift({api: 4, name: 'l337', builder: L337V4});
};
