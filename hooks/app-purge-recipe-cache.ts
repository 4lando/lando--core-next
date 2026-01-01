
export default async (app, lando) => {
  app.log.verbose('removing recipe cache...');
  lando.cache.remove(app.recipeCache);
};
