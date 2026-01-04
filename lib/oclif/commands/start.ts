import {LandoCommand, globalFlags} from '../base-command.js';

export default class Start extends LandoCommand<typeof Start> {
  static id = 'start';
  static description = 'Starts your app';
  static level: 'config' | 'tasks' | 'engine' | 'app' = 'app';

  static flags = {
    ...globalFlags,
  };

  static examples = [
    '<%= config.bin %> <%= command.id %>',
  ];

  async run(): Promise<void> {
    await this.parse(Start);
    const lando = await this.bootstrap('app');
    const app = await lando.getApp();

    if (!app) {
      this.error('Could not find a Lando app in the current directory');
    }

    await app.start();

    this.log(this.makeArt('appStart', app));

    const info = app.info || [];
    if (info.length > 0) {
      this.formatData(info, {format: 'table'});
    }
  }
}
