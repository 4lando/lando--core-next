import {Flags} from '@oclif/core';
import {ux} from '@oclif/core';
import {LandoCommand, globalFlags} from '../base-command.js';
import runTasks from '../../../utils/run-tasks.js';

export default class Update extends LandoCommand<typeof Update> {
  static id = 'update';
  static description = 'Updates lando and installed plugins';
  static level = 'tasks' as const;

  static flags = {
    ...globalFlags,
    yes: Flags.boolean({
      char: 'y',
      description: 'Auto-answer yes to prompts',
      default: false,
    }),
  };

  async run(): Promise<void> {
    const {flags} = await this.parse(Update);
    const lando = await this.bootstrap('tasks');

    const updates = await (lando as any).updates.check();

    if (!updates || updates.length === 0) {
      this.log('Everything is up to date!');
      return;
    }

    ux.table(updates, {
      name: {header: 'Package'},
      current: {header: 'Current'},
      latest: {header: 'Latest'},
    });

    if (!flags.yes) {
      const confirmed = await ux.confirm('Do you want to update?');
      if (!confirmed) {
        this.log('Update cancelled');
        return;
      }
    }

    const tasks = (lando as any).updates.getUpdateTasks(updates);
    await runTasks(tasks, {renderer: 'dc2'});

    this.log('Updates complete!');
  }
}
