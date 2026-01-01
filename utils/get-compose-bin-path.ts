import getDockerBinPath from './get-docker-bin-path.js';

import path from 'path';

export default () => {
  switch (process.platform) {
    case 'darwin':
      return '/Applications/Docker.app/Contents/Resources/bin';
    case 'linux':
      return getDockerBinPath();
    case 'win32': {
      const programFiles = process.env.ProgramW6432 || process.env.ProgramFiles;
      return path.win32.join(programFiles + '\\Docker\\Docker\\resources\\bin');
    }
  }
};
