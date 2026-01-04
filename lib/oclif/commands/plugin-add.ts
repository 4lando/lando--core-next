import {Args, Flags} from '@oclif/core';
import {LandoCommand, globalFlags} from '../base-command.js';
import PluginClass from '../../../components/plugin.js';
import getPluginAddTask from '../../../utils/get-plugin-add-task.js';
import runTasks from '../../../utils/run-tasks.js';

const Plugin = PluginClass as any;

export default class PluginAdd extends LandoCommand<typeof PluginAdd> {
  static id = 'plugin:add';
  static description = 'Adds a plugin to Lando';
  static hidden = true;
  static level = 'tasks' as const;
  static aliases = ['plugin-add'];

  static args = {
    plugin: Args.string({
      description: 'Plugin to add',
      required: true,
    }),
  };

  static flags = {
    ...globalFlags,
    auth: Flags.string({
      description: 'Auth tokens for registry',
      multiple: true,
    }),
    dir: Flags.string({
      description: 'Plugin directories',
      multiple: true,
    }),
    registry: Flags.string({
      description: 'Plugin registries',
      multiple: true,
    }),
  };

  async run(): Promise<void> {
    const {args, flags} = await this.parse(PluginAdd);
    const lando = await this.bootstrap('tasks');

    const plugin = new Plugin(args.plugin, {
      auth: flags.auth,
      dir: flags.dir,
      registry: flags.registry,
      type: 'global',
    });

    const task = await (getPluginAddTask as any)(plugin, lando);
    await (runTasks as any)([task], {renderer: 'dc2'});
  }
}
