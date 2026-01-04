/* eslint-disable require-jsdoc, valid-jsdoc */
import {Command, Flags, Interfaces} from '@oclif/core';
import path from 'path';
import fs from 'fs';
import os from 'os';
import _ from 'lodash';
import chalk from 'chalk';
// @ts-expect-error - no types available
import inquirer from 'inquirer';
// @ts-expect-error - no types available
import sudoBlock from 'sudo-block';
import isInteractive from 'is-interactive';
import {ux} from '@oclif/core';

import Lando from '../lando.js';
import art from '../art.js';
import Yaml from '../yaml.js';
import formatters from '../formatters.js';
import Debug from '../../utils/debug.js';
import getSysDataPath from '../../utils/get-system-data-dir.js';
import isDevVersion from '../../utils/is-dev-version.js';
import getCommitHash from '../../utils/get-commit-hash.js';
import prettify from '../../utils/prettify.js';

// Bootstrap levels matching lib/lando.ts
export type BootstrapLevel = 'config' | 'tasks' | 'engine' | 'app';

export const BOOTSTRAP_LEVELS = {
  config: 1,
  tasks: 2,
  engine: 3,
  app: 4,
} as const;

// Global flags available on all commands
export const globalFlags = {
  channel: Flags.string({
    description: 'Sets the update channel',
    options: ['edge', 'none', 'stable'],
  }),
  clear: Flags.boolean({
    description: 'Clears the lando tasks cache',
  }),
  debug: Flags.boolean({
    char: 'd',
    description: 'Shows debug output',
  }),
  experimental: Flags.boolean({
    description: 'Activates experimental features',
    hidden: true,
  }),
  verbose: Flags.integer({
    char: 'v',
    description: 'Runs with extra verbosity',
    default: 0,
  }),
};

export type GlobalFlags = typeof globalFlags;

/**
 * Base command class for all Lando OCLIF commands.
 * Handles bootstrapping, event emission, and error handling.
 */
export abstract class LandoCommand<T extends typeof Command> extends Command {
  // Bootstrap level this command requires (override in subclasses)
  static level: BootstrapLevel = 'app';

  // Allow unknown flags for tooling passthrough
  static strict = false;

  // Enable flags inheritance
  static enableJsonFlag = false;

  // Global flags
  static baseFlags = globalFlags;

  // Parsed flags and args
  protected flags!: Interfaces.InferredFlags<GlobalFlags & T['flags']>;
  protected args!: Interfaces.InferredArgs<T['args']>;

  // Lando instance (available after init)
  protected lando!: Lando;

  // CLI utilities
  protected prefix = 'LANDO';
  protected logLevel = 'warn';
  protected userConfRoot = path.join(os.homedir(), '.lando');
  protected coreBase = path.resolve(import.meta.dirname, '..', '..');
  // eslint-disable-next-line new-cap
  protected debug: ReturnType<typeof Debug> = Debug('@lando/cli');
  protected chalk = chalk;

  /**
   * Initialize the command - parse flags/args and bootstrap Lando
   */
  async init(): Promise<void> {
    await super.init();
    const ctor = this.constructor as typeof LandoCommand;
    const {args, flags} = await this.parse({
      flags: ctor.flags,
      baseFlags: ctor.baseFlags,
      args: ctor.args,
      strict: ctor.strict,
    });
    this.flags = flags as Interfaces.InferredFlags<GlobalFlags & T['flags']>;
    this.args = args as Interfaces.InferredArgs<T['args']>;

    // Handle global flags that exit early
    if (await this.handleGlobalFlags()) {
      this.exit(0);
    }

    // Check permissions (no sudo)
    this.checkPerms();

    // Bootstrap Lando to required level
    const level = ctor.level;
    this.lando = await this.bootstrap(level);
  }

  /**
   * Handle global flags that should exit early (clear, channel, experimental)
   * @return true if should exit
   */
  protected async handleGlobalFlags(): Promise<boolean> {
    const {clear, channel, experimental} = this.flags;
    const userConfig = this.updateUserConfig();

    if (clear) {
      this.clearTaskCaches();
      console.log('Lando has cleared the tasks cache!');
    }

    if (channel) {
      this.updateUserConfig({channel});
      const updateFile = path.join(this.defaultConfig().userConfRoot as string, 'cache', 'updates');
      if (fs.existsSync(updateFile)) fs.unlinkSync(updateFile);
      console.log(this.makeArt('releaseChannel', channel as string));
    }

    if (experimental) {
      this.updateUserConfig({experimental: !userConfig.experimental});
      console.log(this.makeArt('experimental', !userConfig.experimental));
    }

    if (clear || channel || experimental) {
      this.clearTaskCaches();
      return true;
    }

    return false;
  }

  /**
   * Bootstrap Lando to the specified level
   */
  protected async bootstrap(level: BootstrapLevel): Promise<Lando> {
    const config = this.defaultConfig();
    const lando = new Lando(config);

    // Add CLI reference to lando (using type assertion for legacy compatibility)
    (lando as any).cli = this.getLegacyCliInterface();

    // Handle uncaught errors
    for (const exception of ['unhandledRejection', 'uncaughtException']) {
      process.on(exception, (error: Error) => this.handleError(error, lando));
    }

    // Bootstrap to required level
    await lando.bootstrap(level);

    return lando;
  }

  /**
   * Returns a legacy CLI interface for backward compatibility with existing code
   */
  protected getLegacyCliInterface() {
    return {
      argv: () => this.argv,
      chalk: this.chalk,
      checkPerms: () => this.checkPerms(),
      clearTaskCaches: () => this.clearTaskCaches(),
      confirm: (message?: string) => this.confirm(message),
      defaultConfig: (appConfig?: Record<string, unknown>) => this.defaultConfig(appConfig),
      formatData: (data: unknown, opts?: Record<string, unknown>, extra?: Record<string, unknown>) =>
        this.formatData(data, opts, extra),
      formatOptions: (omit?: string[]) => this.formatOptions(omit),
      getInquirer: () => inquirer,
      getUX: () => ux,
      handleError: (error: Error, _handler: unknown, _verbose?: number, lando?: Lando) =>
        this.handleError(error, lando),
      isDebug: () => this.isDebug(),
      makeArt: (func: string, opts?: unknown) => this.makeArt(func, opts),
      prettify: (data: unknown, opts?: {arraySeparator?: string}) => this.prettify(data, opts),
      updateUserConfig: (data?: Record<string, unknown>) => this.updateUserConfig(data),
    };
  }

  /**
   * Check permissions - block running as sudo
   */
  protected checkPerms(): void {
    sudoBlock(this.makeArt('sudoRun'));
  }

  /**
   * Clear task caches
   */
  protected clearTaskCaches(): void {
    if (process.landoTaskCacheFile && fs.existsSync(process.landoTaskCacheFile)) {
      fs.unlinkSync(process.landoTaskCacheFile);
    }
    if (process.landoAppCacheFile && fs.existsSync(process.landoAppCacheFile)) {
      fs.unlinkSync(process.landoAppCacheFile);
    }
  }

  /**
   * Get app root directory from Lando config
   */
  protected getAppRoot(): string {
    return (this.lando?.config as any)?._app?.root ?? process.cwd();
  }

  /**
   * Confirm dialog helper
   */
  protected confirm(message = 'Are you sure?') {
    return {
      describe: 'Answers yes to prompts',
      alias: ['y'],
      default: false,
      boolean: true,
      interactive: {
        type: 'confirm',
        default: false,
        message,
      },
    };
  }

  /**
   * Get default Lando configuration
   */
  protected defaultConfig(appConfig: Record<string, unknown> = {}): Record<string, unknown> {
    const srcRoot = path.resolve(import.meta.dirname, '..', '..');
    const pjsonPath = path.join(srcRoot, 'package.json');
    const pjson = JSON.parse(fs.readFileSync(pjsonPath, 'utf-8'));

    // Whether CLI is packaged (compiled binary)
    const packaged = Boolean((process as any).pkg) || Boolean((process as any).isBun && (globalThis as any).Bun?.main);
    const dev = packaged && isDevVersion(pjson.version);

    // Entry point detection
    const file = packaged ? process.execPath : process.argv[1];
    const entrypoint = packaged ? process.env._ ?? file : process.argv[1] ?? process.env._;

    // Install path for binaries
    const installPath = path.join(this.userConfRoot, 'bin');

    // Source/git detection
    const args = process.execArgv;
    const source = fs.existsSync(path.join(srcRoot, '.git', 'HEAD'));
    const commit = source ? getCommitHash(srcRoot, {short: true}) : false;
    const coreBase = this.coreBase === path.resolve(import.meta.dirname, '..', '..');
    const slim = !fs.existsSync(path.resolve(import.meta.dirname, '..', '..', 'FATCORE'));

    const cli = {args, commit, coreBase, dev, entrypoint, file, installPath, packaged, plugin: srcRoot, slim, source};
    this.debug('using cli config %o', cli);

    const config: Record<string, unknown> = {
      alliance: fs.existsSync(path.join(this.userConfRoot, 'secret-toggle')),
      channel: 'stable',
      cli,
      configSources: [path.join(srcRoot, 'config.yml'), path.join(this.userConfRoot, 'config.yml')],
      command: {_: this.argv},
      domain: 'lndo.site',
      disablePlugins: ['lando-core', '@lando/core-next'],
      experimental: false,
      envPrefix: this.prefix,
      fatcore: !slim,
      isInteractive: isInteractive(),
      landoFile: '.lando.yml',
      landoFileConfig: appConfig,
      leia: Boolean(process.env.LEIA_PARSER_RUNNING),
      logLevelConsole: this.flags?.verbose ? this.flags.verbose + 1 : this.logLevel,
      logDir: path.join(this.userConfRoot, 'logs'),
      mode: 'cli',
      packaged,
      pluginConfig: {},
      pluginConfigFile: path.join(this.userConfRoot, 'plugin-auth.json'),
      pluginDirs: [
        {path: path.join(srcRoot, 'node_modules', '@lando'), subdir: '.', namespace: '@lando'},
        {path: path.join(getSysDataPath() ?? '', 'plugins'), subdir: '.', type: 'system'},
        {path: path.join(getSysDataPath() ?? '', 'plugins', '@lando'), subdir: '.', namespace: '@lando', type: 'system-lando'},
        {path: path.join(this.userConfRoot, 'global-plugins', '@lando'), subdir: '.', namespace: '@lando'},
        {path: this.userConfRoot, subdir: 'plugins', type: 'user'},
        {path: path.join(this.userConfRoot, 'plugins', '@lando'), subdir: '.', namespace: '@lando', type: 'user-lando'},
      ],
      preLandoFiles: ['.lando.base.yml', '.lando.dist.yml', '.lando.recipe.yml', '.lando.upstream.yml'],
      postLandoFiles: ['.lando.local.yml', '.lando.user.yml'],
      product: 'lando',
      runtime: 3,
      userConfRoot: this.userConfRoot,
    };

    // Version calculations
    (config.cli as any).version = pjson.version;
    if (!cli.packaged && !cli.dev && cli.source && cli.commit) {
      (config.cli as any).version = `${pjson.version}-0-${cli.commit}`;
    }
    config.version = (config.cli as any).version;
    config.userAgent = `Lando/${config.version}`;

    return config;
  }

  /**
   * Format output data
   */
  protected formatData(
    data: unknown,
    {path = '', format = 'default', filter = []}: {path?: string; format?: string; filter?: string[]} = {},
    opts: Record<string, unknown> = {},
  ) {
    // eslint-disable-next-line @typescript-eslint/no-unsafe-function-type
    return (formatters.formatData as Function)(data, {path, format, filter}, opts);
  }

  protected formatOptions(omit: string[] = []) {
    // eslint-disable-next-line @typescript-eslint/no-unsafe-function-type
    return (formatters.formatOptions as Function)(omit);
  }

  /**
   * Check if debug mode is enabled
   */
  protected isDebug(): number {
    const {debug, verbose} = this.flags ?? {};
    return debug ? 1 + (verbose ?? 0) : 0 + (verbose ?? 0);
  }

  /**
   * Handle errors with optional crash reporting
   */
  protected async handleError(error: Error, lando?: Lando): Promise<void> {
    (error as any).verbose = this.flags?.verbose ?? 0;
    this.clearTaskCaches();

    if (lando?.cache && lando?.error) {
      // Ask about error reporting if not set
      if (_.isNil(lando.cache.get('report_errors')) && isInteractive()) {
        console.error(this.makeArt('crash'));
        const answers = await inquirer.prompt([{
          name: 'reportErrors',
          type: 'confirm',
          default: true,
          message: 'Send crash reports?',
        }]);
        lando.cache.set('report_errors', answers.reportErrors, {persist: true});
      }

      const code = await lando.error.handle(error, lando.cache.get('report_errors'));
      this.exit(code);
    } else {
      console.error(error);
      this.exit(1);
    }
  }

  /**
   * Generate CLI art
   */
  protected makeArt(func: string, opts?: unknown): string {
    return (art as any)[func]?.(opts) ?? '';
  }

  /**
   * Prettify data for output
   */
  protected prettify(data: unknown, {arraySeparator = ', '}: {arraySeparator?: string} = {}) {
    return prettify(data, {arraySeparator});
  }

  /**
   * Update user config file
   */
  protected updateUserConfig(data: Record<string, unknown> = {}): Record<string, unknown> {
    const yaml = new Yaml();
    const configFile = path.join(this.defaultConfig().userConfRoot as string, 'config.yml');
    const config = fs.existsSync(configFile) ? yaml.load(configFile) : {};
    const file = yaml.dump(configFile, {...config, ...data});
    return yaml.load(file);
  }

  /**
   * Emit CLI events (for tooling compatibility)
   */
  protected async emitCliEvents(commandName: string, options: Record<string, unknown>): Promise<Record<string, unknown>> {
    const data = {
      options,
      inquiry: formatters.getInteractive({}, options),
    };

    // Emit pre-run events
    await this.lando.events.emit('cli-answers', data, commandName);
    await this.lando.events.emit(`cli-${commandName}-answers`, data, commandName);

    // Handle interactive prompts
    const answers = await formatters.handleInteractive(data.inquiry, data.options, commandName, this.lando, '');

    // Emit run events
    const mergedOptions = {...data.options, ...answers};
    await this.lando.events.emit('cli-run', mergedOptions, commandName);
    await this.lando.events.emit(`cli-${commandName}-run`, data, commandName);

    return mergedOptions;
  }

  /**
   * Cleanup after command execution
   */
  async finally(error?: Error): Promise<void> {
    if (this.lando?.events) {
      await this.lando.events.emit('before-end');
    }
    if (error) {
      await this.handleError(error, this.lando);
    }
  }

  protected get commandClass(): typeof LandoCommand {
    return this.constructor as typeof LandoCommand;
  }
}

// Extend process type for Lando globals
declare global {
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace NodeJS {
    interface Process {
      landoTaskCacheFile?: string;
      landoAppCacheFile?: string;
    }
  }
}
