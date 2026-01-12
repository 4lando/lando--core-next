import getPwshProfile from './get-pwsh-profile.js';
import getUserShell from './get-user-shell.js';

export default (shell = getUserShell()) => {
  if (!shell) {
    console.error('Could not detect shell!');
    return null;
  }

  switch (shell) {
    case 'bash':
    case 'bash.exe':
      return '/etc/bash.bashrc';
    case 'cmd.exe':
      return 'system';
    case 'csh':
    case 'csh.exe':
      return '/etc/csh.cshrc';
    case 'fish':
    case 'fish.exe':
      return '/etc/fish/config.fish';
    case 'powershell.exe':
    case 'pswh':
      return getPwshProfile();
    case 'zsh':
    case 'zsh.exe':
      return ['/etc/zsh/zshrc', '/etc/zshrc'];
    default:
      return '/etc/profile';
  }
};
