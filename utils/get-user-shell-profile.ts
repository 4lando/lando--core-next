import getPwshProfile from './get-pwsh-profile.js';
import getUserShell from './get-user-shell.js';

import os from 'os';
import path from 'path';

export default (shell = getUserShell()) => {
  if (!shell) {
    console.error('Could not detect shell!');
    return null;
  }

  switch (shell) {
    case 'bash':
    case 'bash.exe':
      return path.join(os.homedir(), '.bashrc');
    case 'cmd.exe':
      return 'user';
    case 'csh':
    case 'csh.exe':
      return path.join(os.homedir(), '.cshrc');
    case 'fish':
    case 'fish.exe':
      return path.join(os.homedir(), '.config/fish/config.fish');
    case 'ksh':
    case 'ksh.exe':
      return path.join(os.homedir(), '.kshrc');
    case 'tcsh':
    case 'tcsh.exe':
      return path.join(os.homedir(), '.tcshrc');
    case 'powershell.exe':
    case 'pswh':
      return getPwshProfile();
    case 'zsh':
    case 'zsh.exe':
      return path.join(os.homedir(), '.zshrc');
    default:
      return path.join(os.homedir(), '.profile');
  }
};
