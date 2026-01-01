import purgeV4BuildLocks from './app-purge-v4-build-locks.js';
import runV4BuildImage from './app-run-v4-build-image.js';
import runV4BuildApp from './app-run-v4-build-app.js';

export default async (app, lando) => {
  // @TODO: build locks and hash for v4?
  app.events.on('pre-start', () => async () => await purgeV4BuildLocks(app, lando));
  // IMAGE BUILD
  app.events.on('pre-start', 100, async () => await runV4BuildImage(app, lando));
  // APP BUILD
  app.events.on('pre-start', 110, async () => await runV4BuildApp(app, lando));
  // @TODO: POST BUILD/EXEC BUILD
};
