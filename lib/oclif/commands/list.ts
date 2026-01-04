import { Flags } from '@oclif/core';
import { LandoCommand, globalFlags } from '../base-command.js';

export default class List extends LandoCommand<typeof List> {
  static id = 'list';
  static description = 'Lists all running lando apps and containers';
  static level: 'config' | 'tasks' | 'engine' | 'app' = 'engine';

  static flags = {
    ...globalFlags,
    all: Flags.boolean({
      char: 'a',
      description: 'Show all containers, even those not running',
      default: false,
    }),
    app: Flags.string({
      description: 'Show only containers for a particular app',
    }),
    filter: Flags.string({
      description: 'Filter output by key=value',
    }),
    format: Flags.string({
      description: 'Output format (json, table)',
      default: 'table',
    }),
    path: Flags.string({
      description: 'Return value at path',
    }),
  };

  static examples = [
    '<%= config.bin %> <%= command.id %>',
    '<%= config.bin %> <%= command.id %> --all',
    '<%= config.bin %> <%= command.id %> --app myapp',
    '<%= config.bin %> <%= command.id %> --format json',
  ];

  async run(): Promise<void> {
    const { flags } = await this.parse(List);
    const lando = await this.bootstrap('engine');

    const containers = await lando.engine.list({
      all: flags.all,
      project: flags.app,
    });

    const data = containers.map((container: any) => ({
      app: container.app || container.labels?.['com.docker.compose.project'],
      service: container.service || container.labels?.['com.docker.compose.service'],
      name: container.name || container.Names?.[0],
      status: container.status || container.State,
    }));

    this.formatData(data, {
      path: flags.path,
      format: flags.format,
      filter: flags.filter ? [flags.filter] : undefined,
    });
  }
}
