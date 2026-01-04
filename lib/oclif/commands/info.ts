import { Flags } from '@oclif/core';
import { LandoCommand, globalFlags } from '../base-command.js';
import landoRunSetup from '../../../hooks/lando-run-setup.js';

export default class Info extends LandoCommand<typeof Info> {
  static override id = 'info';
  static override description = 'Prints info about your app';
  static override level = 'app' as const;

  static override flags = {
    ...globalFlags,
    deep: Flags.boolean({
      description: 'Get ALL the info',
      default: false,
    }),
    filter: Flags.string({
      description: 'Filter data by path',
      multiple: true,
    }),
    format: Flags.string({
      description: 'Output format',
      options: ['default', 'json', 'table'],
      default: 'default',
    }),
    path: Flags.string({
      description: 'Only return the value at the given path',
      default: undefined,
    }),
    service: Flags.string({
      char: 's',
      description: 'Get info for only the specified services',
      multiple: true,
    }),
  };

  async run(): Promise<void> {
    const { flags } = await this.parse(Info);
    
    await this.bootstrap('app');
    await landoRunSetup(this.lando);
    
    const app = await this.lando.getApp(this.getAppRoot());
    if (!app) {
      this.error('Could not find Lando app in current directory');
      return;
    }
    await app.init();
    
    let data = app.info;
    
    if (flags.deep) {
      const containers = await this.lando.engine.list({ project: app.project });
      const scanned = await this.lando.engine.scan(containers);
      data = scanned;
    }
    
    if (flags.service && flags.service.length > 0) {
      data = data.filter((item: any) => flags.service?.includes(item.service));
    }
    
    this.formatData(data, {
      format: flags.format as string,
      path: flags.path,
      filter: flags.filter,
    });
  }
}
