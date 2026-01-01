
import fs from 'fs';
import getWinEnvar from '../utils/get-win32-envvar-from-wsl.js';
import path from 'path';
import wslpath from '../utils/winpath-2-wslpath.js';
import remove from '../utils/remove.js';
import debugShim from '../utils/debug-shim.js';
import validateCa from '../utils/validate-ca.js';

export default async lando => {
  const {caCert, caKey} = lando.config;

  // if we dont have any CA stuff, lets see if we can get them from windows
  // @NOTE: we preempt like this so our setup tasks will asses install successfully
  if (lando.config.os.landoPlatform === 'wsl' && !fs.existsSync(caCert) && !fs.existsSync(caKey)) {
    const debug = debugShim(lando.log);
    const winHome = getWinEnvar('USERPROFILE');
    const winCertsDir = wslpath(path.join(winHome, '.lando', 'certs'));
    const wcaCert = path.join(winCertsDir, path.basename(caCert));
    const wcaKey = path.join(winCertsDir, path.basename(caKey));

    // if it makes sense to copy then lets to it
    if (fs.existsSync(wcaCert) && fs.existsSync(wcaKey) && validateCa(wcaCert, wcaKey, {debug})) {
      fs.copyFileSync(wcaCert, caCert);
      fs.copyFileSync(wcaKey, caKey);
      debug('copied existing and valid CA from %o to %o', wcaCert, caCert);

    // otherwise lets purge
    } else {
      remove(wcaCert);
      remove(wcaKey);
      debug('removed invalid CA stuff from %o and %o', wcaCert, wcaKey);
    }
  }
};
