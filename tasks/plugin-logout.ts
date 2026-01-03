import write from '../utils/write-file';
import {color} from '../utils/listr2.js';

export default lando => {
  return {
    command: 'plugin-logout',
    usage: '$0 plugin-logout',
    level: 'tasks',
    run: async () => {
      // write an empty config file
      write(lando.config.pluginConfigFile, {});
      lando.log.debug('wrote empty config to %s', lando.config.pluginConfigFile);

      // tell the user what happened
      console.log(`All ${color.bold('managed sessions')} have been ${color.red('destroyed')}!`);
    },
  };
};
