import merge from 'lodash/merge';

export default async (app, lando) => {
  for (const task of lando.tasks.filter(task => task.override)) {
    const taskModule = await import(task.file);
    const taskFn = taskModule.default || taskModule;
    app._coreToolingOverrides = merge({}, app._coreToolingOverrides, {
      [task.command]: {...taskFn(lando, app), file: task.file},
    });
  }
};
