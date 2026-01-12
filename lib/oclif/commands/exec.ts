import {Args, Flags} from '@oclif/core';
import buildToolingRunner from '../../../utils/build-tooling-runner.js';
import buildDockerExec from '../../../utils/build-docker-exec.js';
import getUser from '../../../utils/get-user.js';
import {LandoCommand, globalFlags} from '../base-command.js';

export default class Exec extends LandoCommand<typeof Exec> {
  static override id = 'exec';
  static override description = 'Runs a command in a service';
  static override level = 'engine' as const;
  static override strict = false;

  static override args = {
    service: Args.string({
      description: 'Service to run command in',
      required: true,
    }),
  };

  static override flags = {
    ...globalFlags,
    user: Flags.string({
      char: 'u',
      description: 'Run as a specific user',
    }),
  };

  static override examples = [
    '<%= config.bin %> <%= command.id %> appserver -- npm install',
    '<%= config.bin %> <%= command.id %> database -- mysql -u root',
  ];

  async run(): Promise<void> {
    const {args, flags, argv} = await this.parse(Exec);
    const lando = await this.bootstrap('engine');

    const appRoot = this.getAppRoot();
    const app = lando.getApp(appRoot);
    if (!app) {
      this.error('Could not find Lando app in current directory');
    }

    await app.init();

    const service = args.service;
    const command = argv.slice(1).join(' ');

    if (!command) {
      this.error('You must provide a command to run');
    }

    const serviceInfo = app.info?.[service];
    if (!serviceInfo) {
      this.error(`Service "${service}" not found. Available services: ${Object.keys(app.info || {}).join(', ')}`);
    }

    const appMount = serviceInfo?.appMount || '/app';
    const user = flags.user || getUser(service, app.info);

    const runner = buildToolingRunner(
      app,
      command,
      service,
      user,
      {},
      undefined,
      appMount,
    );

    await buildDockerExec(lando.config.dockerBin, runner);
  }
}
