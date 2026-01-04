import {Flags} from '@oclif/core';
import {ux} from '@oclif/core';
import groupBy from 'lodash/groupBy.js';
import merge from 'lodash/merge.js';
import sortBy from 'lodash/sortBy.js';

import {LandoCommand} from '../base-command.js';
import {color, figures} from '../../../utils/listr2.js';
import debugShim from '../../../utils/debug-shim.js';
import parsePackageName from '../../../utils/parse-package-name.js';
import parseToPluginStrings from '../../../utils/parse-to-plugin-strings.js';
import shutdownOs from '../../../utils/shutdown-os.js';

const defaultStatus: Record<string, number> = {
  'CANNOT INSTALL': 0,
  'INSTALLED': 0,
  'NOT INSTALLED': 0,
};

const getStatusGroups = (status: any[] = []) => {
  const results = Object.fromEntries(Object.entries(groupBy(status, 'state'))
    .map(([state, items]) => ([state, items.length])));
  return merge({}, defaultStatus, results);
};

const getNotInstalledMessage = (item: any) => {
  const message = [item.comment || `Will install ${item.version}` || 'Will install'];
  if (item.restart) message.push('[Requires restart]');
  return message.join(' ');
};

const getStatusTable = (items: any[]) => ({
  rows: items.map(item => {
    switch (item.state) {
      case 'INSTALLED':
        return merge({}, item, {
          description: item.description,
          status: `${color.green(`${figures.tick} Installed`)}`,
          comment: color.dim('Dialed'),
          weight: -1,
        });
      case 'NOT INSTALLED':
        return merge({}, item, {
          description: item.description,
          status: `${color.yellow(`${figures.warning} Not Installed`)}`,
          comment: color.dim(getNotInstalledMessage(item)),
          weight: 0,
        });
      case 'CANNOT INSTALL':
        return merge({}, item, {
          description: item.description,
          status: `${color.red(`${figures.cross} Cannot Install!`)}`,
          comment: item.comment,
          weight: 1,
        });
    }
  }),
  columns: {
    description: {header: 'THING'},
    status: {header: 'STATUS'},
    comment: {header: 'COMMENT'},
  },
});

export default class Setup extends LandoCommand<typeof Setup> {
  static override description = 'Runs the Lando setup process to install dependencies';
  static override hidden = true;
  static override level = 'engine' as const;

  static override examples = [
    '<%= config.bin %> <%= command.id %> --skip-common-plugins --plugin @lando/php --plugin @lando/mysql --yes',
    '<%= config.bin %> <%= command.id %> --skip-install-ca --build-engine 4.31.0 --build-engine-accept-license',
  ];

  static override flags = {
    'build-engine': Flags.string({
      description: 'Sets the version of the build engine to install',
    }),
    'build-engine-accept-license': Flags.boolean({
      description: 'Accepts the Docker Desktop license during install',
      default: false,
    }),
    'orchestrator': Flags.string({
      description: 'Sets the version of the orchestrator (docker-compose) to install',
    }),
    'plugin': Flags.string({
      description: 'Sets additional plugin(s) to install',
      multiple: true,
      default: [],
    }),
    'skip-common-plugins': Flags.boolean({
      description: 'Disables the installation of common Lando plugins',
      default: false,
    }),
    'skip-install-ca': Flags.boolean({
      description: 'Disables the installation of the Lando Certificate Authority',
      default: false,
    }),
    'skip-networking': Flags.boolean({
      description: 'Disables the installation of Landonet',
      default: false,
      hidden: true,
    }),
    'yes': Flags.boolean({
      char: 'y',
      description: 'Runs non-interactively with all accepted default answers',
      default: false,
    }),
  };

  async run(): Promise<void> {
    const defaults = (this.lando.config as any).setup ?? {};

    console.log(this.makeArt('setupHeader'));

    const options: any = {
      'build-engine': this.flags['build-engine'] ?? defaults.buildEngine,
      'build-engine-accept-license': this.flags['build-engine-accept-license'] ?? defaults.buildEngineAcceptLicense,
      'orchestrator': this.flags.orchestrator ?? defaults.orchestrator,
      'plugin': this.flags.plugin.length > 0 ? this.flags.plugin : parseToPluginStrings(defaults.plugins ?? {}),
      'skip-common-plugins': this.flags['skip-common-plugins'] ?? defaults.skipCommonPlugins,
      'skip-install-ca': this.flags['skip-install-ca'] ?? defaults.skipInstallCa,
      'skip-networking': this.flags['skip-networking'] ?? defaults.skipNetworking,
      'yes': this.flags.yes ?? !(this.lando.config as any).isInteractive,
      'plugins': {},
      'tasks': [],
    };

    for (const plugin of options.plugin) {
      const {name, peg} = parsePackageName(plugin);
      options.plugins[name] = peg === '*' ? 'latest' : peg;
    }

    ux.action.start('Generating plugin installation matrix');
    const pstatus = await (this.lando as any).getInstallPluginsStatus(options);
    const pstatusSummary = getStatusGroups(pstatus);
    options.installPlugins = pstatusSummary['NOT INSTALLED'] + pstatusSummary['CANNOT INSTALL'] > 0;
    ux.action.stop(options.installPlugins ? `${color.green('done')} ${color.dim('[see table below]')}`
      : `${color.green('done')} ${color.dim('[nothing to install]')}`);

    for (const plugin of pstatus) {
      if (plugin.state === 'INSTALLED') {
        delete options.plugins[plugin.id];
      }
    }

    if (options.installPlugins && options.yes === false) {
      const {rows, columns} = getStatusTable(pstatus);
      console.log('');
      ux.table(sortBy(rows, ['row', 'weight']), columns);
      console.log('');

      if (pstatusSummary['CANNOT INSTALL'] === 0) {
        console.log(`Lando would like to install the ${pstatusSummary['NOT INSTALLED']} plugins listed above.`);
        const answer = await ux.confirm(color.bold('DO YOU CONSENT?'));
        if (!answer) throw new Error('Setup terminated!');
      } else {
        console.log(`Lando has detected that ${pstatusSummary['CANNOT INSTALL']} plugins listed above cannot install correctly.`);
        console.log(color.magenta('It may be wise to resolve their issues before continuing!'));
        console.log('');
        const answer = await ux.confirm(color.bold('DO YOU STILL WISH TO CONTINUE?'));
        if (!answer) throw new Error('Setup terminated!');
      }
    }

    const presults = await (this.lando as any).installPlugins(options);

    if (presults.errors.length > 0) {
      const error = new Error(`A setup error occured! Rerun with ${color.bold('lando setup --debug')} for more info.`);
      this.lando.log.debug('%j', presults.errors[0]);
      throw error;
    }

    await (this.lando as any).reloadPlugins();

    ux.action.start('Generating setup task installation matrix');
    const sstatus = await (this.lando as any).getSetupStatus(options);
    const sstatusSummary = getStatusGroups(sstatus);
    options.installTasks = sstatusSummary['NOT INSTALLED'] + sstatusSummary['CANNOT INSTALL'] > 0;
    ux.action.stop(options.installTasks ? `${color.green('done')} ${color.dim('[see table below]')}`
      : `${color.green('done')} ${color.dim('[nothing to install]')}`);

    if (options.installTasks && options.yes === false) {
      const {rows, columns} = getStatusTable(sstatus);

      console.log('');
      ux.table(sortBy(rows, ['description', 'weight']), columns);
      console.log('');

      if (sstatusSummary['CANNOT INSTALL'] === 0) {
        console.log(`Lando would like to run the ${sstatusSummary['NOT INSTALLED']} setup tasks listed above.`);
        const answer = await ux.confirm(color.bold('DO YOU CONSENT?'));
        if (!answer) throw new Error('Setup terminated!');
      } else {
        console.log(`Lando has detected that ${sstatusSummary['CANNOT INSTALL']} setup tasks listed above cannot run correctly.`);
        console.log(color.magenta('It may be wise to resolve their issues before continuing!'));
        console.log('');
        const answer = await ux.confirm(color.bold('DO YOU STILL WISH TO CONTINUE?'));
        if (!answer) throw new Error('Setup terminated!');
      }
    }

    const sresults = await (this.lando as any).setup(options);

    const results = presults.results.concat(sresults.results);
    const errors = presults.errors.concat(sresults.errors);
    console.log('');

    if (errors.length === 0 && results.length === 0) {
      const msg = `As far as ${color.bold('lando setup')} can tell you are ${color.green('good to go')}`;
      console.log(`${msg} and do not require additional setup!`);
      return;
    }

    if (errors.length > 0) {
      const error = new Error(`A setup error occured! Rerun with ${color.bold('lando setup --debug')} for more info.`);
      this.lando.log.debug('%j', errors[0]);
      throw error;
    }

    if (errors.length === 0 && results.length > 0) {
      if (sresults.restart) {
        console.log(`Setup installed ${color.green(results.length)} of ${color.bold(results.length)} things successfully!`);
        console.log(color.magenta('However, a restart is required to complete your setup.'));
        if (options.yes === false) {
          try {
            console.log('');
            await ux.anykey(`Press any key to restart or ${color.yellow('q')} to restart later`);
          } catch {
            throw new Error(`Restart cancelled! ${color.yellow('Note that Lando may not work correctly until you restart!')}`);
          }
        }
        ux.action.start('Restarting');
        await shutdownOs({
          debug: debugShim(this.lando.log),
          message: 'Lando needs to restart to complete setup!',
        });
        ux.action.stop(color.green('done'));
      } else {
        console.log(`Setup installed ${color.green(results.length)} of ${color.bold(results.length)} things successfully!`);
        console.log(`You are now ${color.green('good to go')} and can start using Lando!`);
      }
    }
  }
}
