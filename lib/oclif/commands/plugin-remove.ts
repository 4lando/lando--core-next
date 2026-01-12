import {Args} from '@oclif/core';
import {LandoCommand, globalFlags} from '../base-command.js';
import Plugin from '../../../components/plugin.js';
import getPluginRemoveTask from '../../../utils/get-plugin-remove-task.js';
import runTasks from '../../../utils/run-tasks.js';

export default class PluginRemove extends LandoCommand<typeof PluginRemove> {
  static id = 'plugin:remove';
  static description = 'Removes a plugin from Lando';
  static hidden = true;
  static level = 'tasks' as const;
  static aliases = ['plugin-remove'];

  static args = {
    plugin: Args.string({
      description: 'Plugin to remove',
      required: true,
    }),
  };

  static flags = {
    ...globalFlags,
  };

  async run(): Promise<void> {
    const {args} = await this.parse(PluginRemove);
    const lando = await this.bootstrap('tasks');

    const plugin = new Plugin(args.plugin, {type: 'global'});
    const task = await (getPluginRemoveTask as any)(plugin, lando);
    await (runTasks as any)([task], {renderer: 'dc2'});
  }
}
