
import getWinEnvar from './get-win32-envvar-from-wsl.js';
import path from 'path';
import wslpath from './winpath-2-wslpath.js';

export default (platform = process.landoPlatform ?? process.platform) => {
  switch (platform) {
    case 'darwin':
      return '/Applications/Docker.app';
    case 'win32': {
      const programFiles = process.env.ProgramW6432 ?? process.env.ProgramFiles;
      return path.win32.join(`${programFiles}\\Docker\\Docker\\Docker Desktop.exe`);
    }
    case 'wsl': {
      const programFiles = getWinEnvar('ProgramW6432') ?? getWinEnvar('ProgramFiles');
      const winpath = path.win32.join(`${programFiles}\\Docker\\Docker\\Docker Desktop.exe`);
      return wslpath(winpath);
    }
  }
};
