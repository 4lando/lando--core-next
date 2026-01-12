
import _ from 'lodash';
import fs from 'fs';
import path from 'path';

import loadLegacyInits from './lando-load-legacy-inits.js';

const loadTasksFromManifest = lando => {
  try {
    // lib/task-manifest uses CommonJS - keep require until lib/ is converted
    const {taskManifest} = require('../lib/task-manifest');
    const rootDir = path.resolve(import.meta.dirname, '..');
    for (const {name, factory} of taskManifest) {
      const taskFactory = factory.default || factory;
      const task = taskFactory(lando, {});
      const taskFile = path.join(rootDir, 'tasks', `${name}.ts`);
      lando.tasks.push({...task, file: taskFile});
      lando.log.debug('loaded bundled task %s from %s', name, taskFile);
    }
    return true;
  } catch (err) {
    lando.log.debug('manifest load failed: %s', err.message);
    return false;
  }
};

const loadTasksFromFilesystem = lando => {
  const pluginsWithTasks = lando.config.plugins.filter(plugin => fs.existsSync(plugin.tasks));

  const taskFiles = _.flatten(pluginsWithTasks.map(plugin =>
    _(fs.readdirSync(plugin.tasks))
      .map(file => path.join(plugin.tasks, file))
      .filter(filePath => _.endsWith(filePath, '.js') || _.endsWith(filePath, '.ts'))
      .value(),
  ));

  // Dynamic require for loading arbitrary task files at runtime
  for (const file of taskFiles) {
    const taskModule = require(file);
    const taskFn = taskModule.default || taskModule;
    lando.tasks.push({...taskFn(lando, {}), file});
    lando.log.debug('autoloaded global task %s', path.basename(file, '.js'));
  }
};

export default async lando => {
  await loadLegacyInits(lando);

  if (!loadTasksFromManifest(lando)) {
    loadTasksFromFilesystem(lando);
  }

  lando.cache.set('_.tasks.cache', JSON.stringify(lando.tasks), {persist: true});
};
