import {Args, Flags} from '@oclif/core';
import {LandoCommand, globalFlags} from '../base-command.js';
// @ts-expect-error - no types available
import profile from 'npm-profile';
import getPluginConfig from '../../../utils/get-plugin-config.js';
import lopts2Popts from '../../../utils/lopts-2-popts.js';
import write from '../../../utils/write-file.js';

export default class PluginLogin extends LandoCommand<typeof PluginLogin> {
  static override id = 'plugin:login';
  static override description = 'Logs into a plugin registry';
  static level = 'tasks' as const;
  static override aliases = ['plugin-login'];

  static override args = {
    registry: Args.string({
      description: 'Registry to login to',
      default: 'https://registry.lando.dev',
    }),
  };

  static override flags = {
    ...globalFlags,
    username: Flags.string({
      char: 'u',
      description: 'Username',
      required: true,
    }),
    password: Flags.string({
      char: 'p',
      description: 'Password',
      required: true,
    }),
    scope: Flags.string({
      char: 's',
      description: 'Scope',
      default: '@lando',
    }),
  };

  async run(): Promise<void> {
    const {args, flags} = await this.parse(PluginLogin);
    const lando = await this.bootstrap('tasks');

    const registry = args.registry;
    const {username, password, scope} = flags;

    try {
      const result = await profile.loginCouch(username, password, {registry});
      const token = result.token;

      if (!token) {
        throw new Error('Login failed - no token received');
      }

      const options = {
        auth: [`${registry}=${token}`],
        registry: [registry],
        scope: scope ? [scope] : [],
      };

      const pluginConfigFile = lando.config.pluginConfigFile as string;
      const existingConfig = (getPluginConfig as any)(pluginConfigFile);
      const newConfig = (lopts2Popts as any)(options);
      const mergedConfig = {...existingConfig, ...newConfig};

      (write as any)(pluginConfigFile, mergedConfig);

      console.log(`Successfully logged into ${registry}`);
    } catch (error: any) {
      throw new Error(`Login failed: ${error.message}`);
    }
  }
}
