import parsePackageName from './parse-package-name.js';
import PluginClass from '../components/plugin.js';

import os from 'os';

// checks to see if a setting is disabled
export default (plugin, {
  dir = os.tmpdir(),
  Plugin = PluginClass,
} = {}) => {
  // parse into a full package
  const pkg = parsePackageName(plugin);

  return {
    title: `Updating ${pkg.name} to v${pkg.peg}`,
    description: pkg.name,
    canInstall: async () => {
      await Plugin.info(plugin);
      return true;
    },
    task: async (ctx, task) => {
      try {
        // add the plugin
        task.plugin = await Plugin.fetch(plugin, {config: Plugin.config, dest: dir});

        // update and and return
        task.title = `Updated ${task.plugin.name} to v${task.plugin.version}`;
        return task.plugin;

      // if we have an error then add it to the status object and throw
      // @TODO: make sure we force remove any errered plugins?
      } catch (error) {
        error.plugin = task.plugin;
        throw error;
      }
    },
  };
};
