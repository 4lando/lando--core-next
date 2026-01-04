import {Flags} from '@oclif/core';
import {LandoCommand, globalFlags} from '../base-command.js';
import getBinPaths from '../../../utils/get-bin-paths.js';
import getShellEnv from '../../../utils/get-shellenv.js';
import updateShellProfile from '../../../utils/update-shell-profile.js';

export default class Shellenv extends LandoCommand<typeof Shellenv> {
  static id = 'shellenv';
  static description = 'Prints or modifies shell environment configuration';
  static hidden = true;
  static level = 'tasks' as const;

  static flags = {
    ...globalFlags,
    add: Flags.string({
      description: 'Add lando to PATH in shell profile',
    }),
    check: Flags.boolean({
      description: 'Check if lando is in PATH',
      default: false,
    }),
  };

  async run(): Promise<void> {
    const {flags} = await this.parse(Shellenv);
    const lando = await this.bootstrap('tasks');

    const binPaths = getBinPaths(lando.config);

    if (flags.add) {
      await (updateShellProfile as any)(flags.add, binPaths);
      this.log(`Added lando to ${flags.add} shell profile`);
      return;
    }

    if (flags.check) {
      const pathArray = Array.isArray(binPaths) ? binPaths : [binPaths];
      const inPath = pathArray.some((p: any) => process.env.PATH?.includes(String(p)));
      this.log(inPath ? 'Lando is in PATH' : 'Lando is NOT in PATH');
      process.exitCode = inPath ? 0 : 1;
      return;
    }

    const shellenv = (getShellEnv as any)(binPaths);
    this.log(shellenv);
  }
}
