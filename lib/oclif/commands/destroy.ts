import { Flags, ux } from '@oclif/core';
import { LandoCommand, globalFlags } from '../base-command.js';
import landoRunSetup from '../../../hooks/lando-run-setup.js';

export default class Destroy extends LandoCommand<typeof Destroy> {
  static override id = 'destroy';
  static override description = 'Destroys your app';
  static override level = 'app' as const;

  static override flags = {
    ...globalFlags,
    yes: Flags.boolean({
      char: 'y',
      description: 'Answers yes to prompts',
      default: false,
    }),
  };

  async run(): Promise<void> {
    const { flags } = await this.parse(Destroy);
    
    await this.bootstrap('app');
    await landoRunSetup(this.lando);
    
    const app = await this.lando.getApp(this.getAppRoot());
    if (!app) {
      this.error('Could not find Lando app in current directory');
      return;
    }
    
    if (!flags.yes) {
      const confirmed = await ux.confirm(`Are you sure you want to DESTROY ${app.name}?`);
      if (!confirmed) {
        this.log('Destroy cancelled');
        return;
      }
    }
    
    await app.destroy();
    
    this.log(this.makeArt('appDestroy', { name: app.name, phase: 'post' }));
  }
}
