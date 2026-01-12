import {Args} from '@oclif/core';
import {LandoCommand, globalFlags} from '../base-command.js';
import write from '../../../utils/write-file.js';

export default class PluginLogout extends LandoCommand<typeof PluginLogout> {
  static override id = 'plugin:logout';
  static override description = 'Logs out of all plugin registries';
  static hidden = true;
  static level = 'tasks' as const;
  static override aliases = ['plugin-logout'];

  static override args = {
    registry: Args.string({
      description: 'Registry to logout from (ignored - logs out of all)',
      required: false,
    }),
  };

  static override flags = {
    ...globalFlags,
  };

  async run(): Promise<void> {
    await this.parse(PluginLogout);
    const lando = await this.bootstrap('tasks');

    const pluginConfigFile = lando.config.pluginConfigFile as string;
    (write as any)(pluginConfigFile, {});

    console.log('All managed sessions have been destroyed!');
  }
}
