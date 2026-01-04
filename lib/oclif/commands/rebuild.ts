import { Flags, ux } from '@oclif/core';
import { LandoCommand, globalFlags } from '../base-command.js';
import landoRunSetup from '../../../hooks/lando-run-setup.js';

export default class Rebuild extends LandoCommand<typeof Rebuild> {
  static override id = 'rebuild';
  static override description = 'Rebuilds your app from scratch, preserving data';
  static override level = 'app' as const;

  static override flags = {
    ...globalFlags,
    service: Flags.string({
      char: 's',
      description: 'Rebuild only the specified services',
      multiple: true,
    }),
    yes: Flags.boolean({
      char: 'y',
      description: 'Answers yes to prompts',
      default: false,
    }),
  };

  async run(): Promise<void> {
    const { flags } = await this.parse(Rebuild);
    
    await this.bootstrap('app');
    await landoRunSetup(this.lando);
    
    const app = await this.lando.getApp(this.getAppRoot());
    if (!app) {
      this.error('Could not find Lando app in current directory');
      return;
    }
    
    if (!flags.yes) {
      const confirmed = await ux.confirm(`Are you sure you want to rebuild ${app.name}?`);
      if (!confirmed) {
        this.log('Rebuild cancelled');
        return;
      }
    }
    
    await app.rebuild();
    
    this.log(this.makeArt('appRebuild', { name: app.name, phase: 'post' }));
    
    const data = await (app as any).getStartTable?.() ?? [];
    if (data.length > 0) {
      this.formatData(data, { format: 'table' });
    }
  }
}
