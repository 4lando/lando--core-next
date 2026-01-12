
import _ from 'lodash';

import buildToolingTask from '../utils/build-tooling-task.js';
import getToolingTasks from '../utils/get-tooling-tasks.js';

export default async (app, lando) => {
  if (!_.isEmpty(_.get(app, 'config.tooling', {}))) {
    app.log.verbose('additional tooling detected');

    // Add the tasks after we init the app
    _.forEach(getToolingTasks(app.config.tooling, app), task => {
      app.log.debug('adding app cli task %s', task.name);
      const injectable = _.has(app, 'engine') ? app : lando;
      app.tasks.push(buildToolingTask(task, injectable));
    });
  }
};
