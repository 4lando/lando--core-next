import {Flags, ux} from '@oclif/core';
import {LandoCommand, globalFlags} from '../base-command.js';

export default class Version extends LandoCommand<typeof Version> {
  static id = 'version';
  static description = 'Displays version information for Lando and installed plugins';
  static level: 'config' | 'tasks' | 'engine' | 'app' = 'tasks';

  static examples = [
    '<%= config.bin %> version',
    '<%= config.bin %> version --all',
    '<%= config.bin %> version --full',
  ];

  static flags = {
    ...globalFlags,
    all: Flags.boolean({
      char: 'a',
      description: 'Show all version information',
      default: false,
    }),
    component: Flags.string({
      hidden: true,
    }),
    full: Flags.boolean({
      description: 'Show full version information',
      default: false,
    }),
    plugin: Flags.string({
      char: 'p',
      description: 'Show version for a specific plugin',
    }),
  };

  async run(): Promise<void> {
    const {flags} = await this.parse(Version);
    const lando = await this.bootstrap('tasks');


    const config = lando.config as Record<string, unknown>;
    const plugins = (config.plugins || []) as Array<{ name: string; version: string; location: string }>;

    if (flags.component) {
      const plugin = plugins.find(p => p.name === flags.component);
      if (plugin) {
        this.log(plugin.version);
      }
      return;
    }

    if (flags.plugin) {
      const plugin = plugins.find(p => p.name === flags.plugin);
      if (plugin) {
        ux.table([plugin], {
          name: {header: 'Plugin'},
          version: {header: 'Version'},
          location: {header: 'Location', extended: true},
        }, {extended: flags.full});
      } else {
        this.warn(`Plugin ${flags.plugin} not found`);
      }
      return;
    }

    if (flags.all) {
      const rows = [
        {name: 'lando', version: config.version as string, location: config.userConfRoot as string},
        ...plugins,
      ];
      ux.table(rows, {
        name: {header: 'Component'},
        version: {header: 'Version'},
        location: {header: 'Location', extended: true},
      }, {extended: flags.full});
    } else {
      this.log(config.version as string);
    }
  }
}
