
import fs from 'fs';
import path from 'path';

import makeExecutable from '../utils/make-executable.js';
import moveConfig from '../utils/move-config.js';

export default async lando => {
  return lando.Promise.map(lando.config.plugins, plugin => {
    if (fs.existsSync(plugin.scripts)) {
      const confDir = path.join(lando.config.userConfRoot, 'scripts');
      const dest = moveConfig(plugin.scripts, confDir);
      makeExecutable(fs.readdirSync(dest), dest);
      lando.log.debug('automoved scripts from %s to %s and set to mode 755', plugin.scripts, confDir);
    }
  });
};
