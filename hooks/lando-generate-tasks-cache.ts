'use strict';

const _ = require('lodash');
const fs = require('fs');
const path = require('path');

const loadTasksFromManifest = lando => {
  try {
    const {taskManifest} = require('../lib/task-manifest');
    const rootDir = path.resolve(__dirname, '..');
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

  for (const file of taskFiles) {
    lando.tasks.push({...require(file)(lando, {}), file});
    lando.log.debug('autoloaded global task %s', path.basename(file, '.js'));
  }
};

module.exports = async lando => {
  await require('./lando-load-legacy-inits')(lando);

  if (!loadTasksFromManifest(lando)) {
    loadTasksFromFilesystem(lando);
  }

  lando.cache.set('_.tasks.cache', JSON.stringify(lando.tasks), {persist: true});
};
