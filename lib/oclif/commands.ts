/* eslint-disable require-jsdoc */
import type {Command} from '@oclif/core';

import Config from './commands/config.js';
import Destroy from './commands/destroy.js';
import Exec from './commands/exec.js';
import Info from './commands/info.js';
import Init from './commands/init.js';
import List from './commands/list.js';
import Logs from './commands/logs.js';
import PluginAdd from './commands/plugin-add.js';
import PluginLogin from './commands/plugin-login.js';
import PluginLogout from './commands/plugin-logout.js';
import PluginRemove from './commands/plugin-remove.js';
import Poweroff from './commands/poweroff.js';
import Rebuild from './commands/rebuild.js';
import Restart from './commands/restart.js';
import Setup from './commands/setup.js';
import Share from './commands/share.js';
import Shellenv from './commands/shellenv.js';
import Ssh from './commands/ssh.js';
import Start from './commands/start.js';
import Stop from './commands/stop.js';
import Update from './commands/update.js';
import Version from './commands/version.js';

const COMMANDS: Record<string, typeof Command> = {
  'config': Config as unknown as typeof Command,
  'destroy': Destroy as unknown as typeof Command,
  'exec': Exec as unknown as typeof Command,
  'info': Info as unknown as typeof Command,
  'init': Init as unknown as typeof Command,
  'list': List as unknown as typeof Command,
  'logs': Logs as unknown as typeof Command,
  'plugin-add': PluginAdd as unknown as typeof Command,
  'plugin-login': PluginLogin as unknown as typeof Command,
  'plugin-logout': PluginLogout as unknown as typeof Command,
  'plugin-remove': PluginRemove as unknown as typeof Command,
  'poweroff': Poweroff as unknown as typeof Command,
  'rebuild': Rebuild as unknown as typeof Command,
  'restart': Restart as unknown as typeof Command,
  'setup': Setup as unknown as typeof Command,
  'share': Share as unknown as typeof Command,
  'shellenv': Shellenv as unknown as typeof Command,
  'ssh': Ssh as unknown as typeof Command,
  'start': Start as unknown as typeof Command,
  'stop': Stop as unknown as typeof Command,
  'update': Update as unknown as typeof Command,
  'version': Version as unknown as typeof Command,
};

export default COMMANDS;

export function registerCommand(id: string, cmd: typeof Command): void {
  COMMANDS[id] = cmd;
}

export function unregisterCommand(id: string): void {
  delete COMMANDS[id];
}

export function getCommand(id: string): typeof Command | undefined {
  return COMMANDS[id];
}

export function listCommands(): string[] {
  return Object.keys(COMMANDS);
}
