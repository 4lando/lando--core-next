import {Flags} from '@oclif/core';
import {LandoCommand, globalFlags} from '../base-command.js';
import get from 'lodash/get.js';

export default class Config extends LandoCommand<typeof Config> {
  static id = 'config';
  static description = 'Displays the Lando configuration';
  static level: 'config' | 'tasks' | 'engine' | 'app' = 'tasks';

  static examples = [
    '<%= config.bin %> config',
    '<%= config.bin %> config --format json',
    '<%= config.bin %> config --path plugins',
  ];

  static flags = {
    ...globalFlags,
    field: Flags.string({
      hidden: true,
    }),
    format: Flags.string({
      char: 'f',
      description: 'Output format',
      options: ['default', 'json', 'table'],
      default: 'default',
    }),
    path: Flags.string({
      char: 'p',
      description: 'Path to a specific config value',
    }),
  };

  async run(): Promise<void> {
    const {flags} = await this.parse(Config);
    const lando = await this.bootstrap('tasks');

    let data: unknown = lando.config;

    if (flags.path || flags.field) {
      const path = flags.path || flags.field;
      data = get(lando.config, path as string);
    }

    this.formatData(data, {
      path: flags.path,
      format: flags.format,
    });
  }
}
