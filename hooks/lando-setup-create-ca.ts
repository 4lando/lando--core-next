
import fs from 'fs';
import getWinEnvar from '../utils/get-win32-envvar-from-wsl.js';
import path from 'path';
import wslpath from '../utils/winpath-2-wslpath.js';
import remove from '../utils/remove.js';
import debugShim from '../utils/debug-shim.js';
import validateCa from '../utils/validate-ca.js';
import writeFile from '../utils/write-file.js';
import {createCA} from 'mkcert';

export default async (lando, options) => {
  const debug = debugShim(lando.log);

  const {caCert, caKey} = lando.config;

  // create CA
  options.tasks.push({
    title: 'Creating Lando Development CA',
    id: 'create-ca',
    description: '@lando/ca',
    comments: {
      'NOT INSTALLED': 'Will create Lando Development Certificate Authority (CA)',
    },
    hasRun: async () => {
      if ([caCert, caKey].some(file => !fs.existsSync(file))) return false;

      // check if the ca is valid and has a matching key
      if (!validateCa(caCert, caKey, {debug})) {
        remove(caCert);
        remove(caKey);
        return false;
      }

      // otherwise we are good
      return true;
    },
    task: async (ctx, task) => {
      // generate the CA and KEY
      const {cert, key} = await createCA({
        organization: 'Lando Development CA',
        countryCode: 'US',
        state: 'California',
        locality: 'Oakland',
        validity: 8675,
      });

      // write the cert and key
      writeFile(caCert, cert);
      writeFile(caKey, key);

      // on wsl we also want to move these over
      if (lando.config.os.landoPlatform === 'wsl') {
        const winHome = getWinEnvar('USERPROFILE');
        const winCertsDir = wslpath(path.join(winHome, '.lando', 'certs'));
        const wcaCert = path.join(winCertsDir, path.basename(caCert));
        const wcaKey = path.join(winCertsDir, path.basename(caKey));
        writeFile(wcaCert, cert);
        writeFile(wcaKey, key);
      }

      task.title = 'Created Lando Development CA';
    },
  });
};
