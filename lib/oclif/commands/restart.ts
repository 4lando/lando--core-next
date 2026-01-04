import {ux} from '@oclif/core';
import landoRunSetup from '../../../hooks/lando-run-setup.js';
import {appRestart} from '../../art.js';
import {LandoCommand, globalFlags} from '../base-command.js';

export default class Restart extends LandoCommand<typeof Restart> {
  static override id = 'restart';
  static override description = 'Restarts your app';
  static override level = 'app' as const;

  static override flags = {
    ...globalFlags,
  };

  async run(): Promise<void> {
    const lando = await this.bootstrap('app');
    await landoRunSetup(lando);

    const app = lando.getApp(this.getAppRoot());
    if (!app) {
      this.error('Could not find Lando app in current directory');
    }

    await app.restart();

    const artOutput = appRestart({phase: 'post'});
    ux.log(artOutput);

    const info = app.info;
    if (info && Object.keys(info).length > 0) {
      this.formatData(info, {format: 'table'});
    }
  }
}
