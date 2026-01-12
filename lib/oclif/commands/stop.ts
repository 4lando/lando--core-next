import {LandoCommand, globalFlags} from '../base-command.js';

export default class Stop extends LandoCommand<typeof Stop> {
  static id = 'stop';
  static description = 'Stops your app';
  static level: 'config' | 'tasks' | 'engine' | 'app' = 'app';

  static flags = {
    ...globalFlags,
  };

  static examples = [
    '<%= config.bin %> <%= command.id %>',
  ];

  async run(): Promise<void> {
    await this.parse(Stop);
    const lando = await this.bootstrap('app');
    const app = await lando.getApp();

    if (!app) {
      this.error('Could not find a Lando app in the current directory');
    }

    await app.stop();

    this.log(this.makeArt('appStop', app));
  }
}
