import { LandoCommand, globalFlags } from '../base-command.js';
import { shareWait } from '../../art.js';

export default class Share extends LandoCommand<typeof Share> {
  static id = 'share';
  static description = 'Shares your local site publicly';
  static hidden = true;
  static level = 'app' as const;

  static flags = {
    ...globalFlags,
  };

  async run(): Promise<void> {
    await this.parse(Share);
    this.log(shareWait());
  }
}
