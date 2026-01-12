import getUserShell from './get-user-shell.js';

export default (paths = [], shell = getUserShell()) => {
  // return NADA if no paths
  if (paths.length === 0) return '';

  // otherwise switchit
  switch (shell) {
    case 'powershell.exe':
    case 'cmd.exe':
      return paths.join(';');

    default:
      return paths.join(':');
  }
};
