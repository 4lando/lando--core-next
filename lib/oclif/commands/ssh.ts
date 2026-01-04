import { Args, Flags } from '@oclif/core';
import landoRunSetup from '../../../hooks/lando-run-setup.js';
import buildToolingRunner from '../../../utils/build-tooling-runner.js';
import buildDockerExec from '../../../utils/build-docker-exec.js';
import getUser from '../../../utils/get-user.js';
import { LandoCommand, globalFlags } from '../base-command.js';

export default class Ssh extends LandoCommand<typeof Ssh> {
  static override id = 'ssh';
  static override description = 'Drops into a shell on a service, runs commands';
  static override level = 'app' as const;
  static override strict = false;

  static override flags = {
    ...globalFlags,
    command: Flags.string({
      char: 'c',
      description: 'Run a command in the service',
    }),
    service: Flags.string({
      char: 's',
      description: 'SSH into this service',
      default: 'appserver',
    }),
    user: Flags.string({
      char: 'u',
      description: 'Run as a specific user',
    }),
  };

  async run(): Promise<void> {
    const { flags, argv } = await this.parse(Ssh);
    const lando = await this.bootstrap('app');
    await landoRunSetup(lando);

    const app = lando.getApp(this.getAppRoot());
    if (!app) {
      this.error('Could not find Lando app in current directory');
    }

    await app.init();

    const service = flags.service || 'appserver';
    const command = flags.command || (argv.length > 0 ? argv.join(' ') : undefined);
    
    const serviceInfo = app.info?.[service];
    const appMount = serviceInfo?.appMount || '/app';
    const user = flags.user || getUser(service, app.info);

    const runner = buildToolingRunner(
      app,
      command || '/bin/sh',
      service,
      user,
      {},
      undefined,
      appMount
    );

    await buildDockerExec(lando.config.dockerBin, runner);
  }
}
