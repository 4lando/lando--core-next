import {Flags} from '@oclif/core';
import {LandoCommand, globalFlags} from '../base-command.js';
import landoRunSetup from '../../../hooks/lando-run-setup.js';

export default class Logs extends LandoCommand<typeof Logs> {
  static override id = 'logs';
  static override description = 'Displays logs for your app';
  static override level = 'app' as const;

  static override flags = {
    ...globalFlags,
    follow: Flags.boolean({
      char: 'f',
      description: 'Follow logs',
      default: false,
    }),
    service: Flags.string({
      char: 's',
      description: 'Show logs for the specified services only',
      multiple: true,
    }),
    timestamps: Flags.boolean({
      char: 't',
      description: 'Show timestamps',
      default: false,
    }),
  };

  async run(): Promise<void> {
    const {flags} = await this.parse(Logs);

    await this.bootstrap('app');
    await landoRunSetup(this.lando);

    const app = await this.lando.getApp(this.getAppRoot());
    if (!app) {
      this.error('Could not find Lando app in current directory');
      return;
    }
    await app.init();

    const logOptions = {
      follow: flags.follow,
      timestamps: flags.timestamps,
      services: flags.service ?? Object.keys(app.services),
    };

    await this.lando.engine.logs(app.project, logOptions);
  }
}
