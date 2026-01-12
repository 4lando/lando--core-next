
import _ from 'lodash';

import unsupportedVersionWarning from '../messages/unsupported-version-warning.js';
import untestedVersionNotice from '../messages/untested-version-notice.js';
import updateDockerComposeWarning from '../messages/update-docker-compose-warning.js';
import updateDockerDesktopWarning from '../messages/update-docker-desktop-warning.js';

export default async (app, lando) => {
  _.forEach(_(lando.versions).filter(version => version && version.dockerVersion).value(), thing => {
    // handle generic unsupported or untested notices
    if (!thing.satisfied) app.addMessage(unsupportedVersionWarning(thing));
    if (thing.untested) app.addMessage(untestedVersionNotice(thing));

    // handle docker compose recommend update
    if (thing.name === 'compose' && thing.rupdate) {
      app.addMessage(updateDockerComposeWarning(thing));
    }
    // handle docker desktop recommend update
    if (thing.name === 'desktop' && thing.rupdate) {
      thing.os = process.platform === 'darwin' ? 'mac' : 'windows';
      app.addMessage(updateDockerDesktopWarning(thing));
    }
  });
};
