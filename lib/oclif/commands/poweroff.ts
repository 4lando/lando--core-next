import { ux } from '@oclif/core';
import { poweroff } from '../../art.js';
import { LandoCommand, globalFlags } from '../base-command.js';

export default class Poweroff extends LandoCommand<typeof Poweroff> {
  static override id = 'poweroff';
  static override description = 'Spins down all Lando related containers';
  static override level = 'engine' as const;

  static override flags = {
    ...globalFlags,
  };

  async run(): Promise<void> {
    const lando = await this.bootstrap('engine');

    const containers = await lando.engine.list();
    
    if (containers.length === 0) {
      ux.log('No Lando containers are running.');
      return;
    }

    for (const container of containers) {
      ux.action.start(`Stopping ${container.name || container.id}`);
      try {
        await lando.engine.stop({ id: container.id });
        ux.action.stop('done');
      } catch (err) {
        ux.action.stop('failed');
      }
    }

    await lando.events.emit('poweroff');

    const artOutput = poweroff();
    ux.log(artOutput);
  }
}
