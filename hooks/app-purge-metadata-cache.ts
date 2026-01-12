
export default async (app, lando) => {
  app.log.debug('removing metadata cache...');
  lando.cache.remove(app.metaCache);
};
