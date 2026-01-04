import { Args, Command, Flags } from '@oclif/core';

import Lando from '../lando.js';
import buildToolingRunner from '../../utils/build-tooling-runner.js';
import buildDockerExec from '../../utils/build-docker-exec.js';
import getToolingDefaults from '../../utils/get-tooling-defaults.js';
import parseToolingConfig from '../../utils/parse-tooling-config.js';
import getDockerBinPath from '../../utils/get-docker-bin-path.js';

export interface ToolingOption {
  alias?: string | string[];
  describe?: string;
  string?: boolean;
  boolean?: boolean;
  array?: boolean;
  choices?: string[];
  default?: unknown;
  interactive?: {
    type: string;
    message: string;
    choices?: string[];
    default?: unknown;
    when?: (answers: Record<string, unknown>) => boolean;
  };
  passthrough?: boolean;
}

export interface ToolingPositional {
  describe?: string;
  type?: 'string' | 'number';
  choices?: string[];
  default?: unknown;
}

export interface ToolingConfig {
  service?: string;
  cmd?: string | string[] | Record<string, string | string[]>;
  user?: string;
  env?: Record<string, string>;
  dir?: string;
  options?: Record<string, ToolingOption>;
  positionals?: Record<string, ToolingPositional>;
  describe?: string;
  usage?: string;
  examples?: string[];
  level?: 'app' | 'engine';
  disabled?: boolean;
}

function convertOptionsToFlags(options: Record<string, ToolingOption> = {}) {
  const flags: Record<string, unknown> = {};
  
  for (const [name, opt] of Object.entries(options)) {
    const charValue = opt.alias 
      ? (Array.isArray(opt.alias) ? opt.alias[0] : opt.alias)[0] as 'a'
      : undefined;
    
    if (opt.boolean) {
      flags[name] = Flags.boolean({
        description: opt.describe,
        default: opt.default as boolean | undefined,
        char: charValue,
      });
    } else if (opt.array) {
      flags[name] = Flags.string({
        description: opt.describe,
        multiple: true,
        char: charValue,
        options: opt.choices,
      });
    } else {
      flags[name] = Flags.string({
        description: opt.describe,
        default: opt.default as string | undefined,
        char: charValue,
        options: opt.choices,
      });
    }
  }
  
  return flags;
}

function convertPositionalsToArgs(positionals: Record<string, ToolingPositional> = {}) {
  const args: Record<string, ReturnType<typeof Args.string>> = {};
  
  for (const [name, pos] of Object.entries(positionals)) {
    args[name] = Args.string({
      description: pos.describe,
      default: pos.default as string | undefined,
      required: pos.default === undefined,
      options: pos.choices,
    });
  }
  
  return args;
}

export function createToolingCommand(
  name: string,
  config: ToolingConfig,
  appName: string,
  appConfig: Record<string, unknown>,
): typeof Command {
  const eventName = name.split(' ')[0];
  
  class ToolingCommandImpl extends Command {
    static id = name;
    static description = config.describe || `Run ${name} commands`;
    static examples = config.examples || [];
    static strict = false;
    
    static flags = {
      debug: Flags.boolean({ char: 'd', description: 'Enable debug mode' }),
      verbose: Flags.integer({ char: 'v', description: 'Verbosity level', default: 0 }),
      ...convertOptionsToFlags(config.options),
    };
    
    static args = convertPositionalsToArgs(config.positionals);
    
    async run(): Promise<void> {
      const { args, flags, argv } = await this.parse(ToolingCommandImpl);
      
      const lando = new Lando(appConfig);
      await lando.bootstrap(config.level === 'engine' ? 'engine' : 'app');
      
      const app = await lando.getApp(lando.config.landoFile);
      if (!app) {
        throw new Error('Could not find Lando app configuration');
      }
      
      if (config.level !== 'engine') {
        await app.init();
      }
      
      await lando.events.emit(`pre-${eventName}`, { ...args, ...flags });
      
      const defaults = (getToolingDefaults as (opts: Record<string, unknown>) => Record<string, unknown>)({
        name,
        app: app.config || {},
        appMount: app.config?.appMount,
        cmd: config.cmd || name,
        dir: config.dir,
        description: config.describe,
        env: config.env || {},
        options: config.options || {},
        service: config.service || '',
        stdio: 'inherit',
        user: config.user || null,
      });
      
      const toolingConfigs = parseToolingConfig(name, defaults, { ...args, ...flags }, argv as string[]);
      const docker = getDockerBinPath();
      
      for (const cmd of toolingConfigs) {
        const runner = buildToolingRunner(
          app,
          cmd.command || cmd.cmd,
          cmd.service,
          cmd.user,
          cmd.env || {},
          cmd.dir,
          app.config?.appMount,
        );
        await buildDockerExec(docker, runner);
      }
      
      await lando.events.emit(`post-${eventName}`, { ...args, ...flags });
    }
  }
  
  Object.defineProperty(ToolingCommandImpl, 'name', { value: `Tooling_${name.replace(/\s+/g, '_')}` });
  
  return ToolingCommandImpl;
}

export function createToolingCommands(
  tooling: Record<string, ToolingConfig>,
  appName: string,
  appConfig: Record<string, unknown>,
): Map<string, typeof Command> {
  const commands = new Map<string, typeof Command>();
  
  for (const [name, cmdConfig] of Object.entries(tooling)) {
    if (cmdConfig.disabled) continue;
    
    const command = createToolingCommand(name, cmdConfig, appName, appConfig);
    commands.set(name, command);
  }
  
  return commands;
}
