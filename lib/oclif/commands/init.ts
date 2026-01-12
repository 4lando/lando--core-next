import {Flags} from '@oclif/core';
import fs from 'fs';
import path from 'path';
import _ from 'lodash';

import {LandoCommand} from '../base-command.js';

import getInitRunner from '../../../utils/build-init-runner.js';
import getInitRunnerDefaults from '../../../utils/get-init-runner-defaults.js';
import runInit from '../../../utils/run-init.js';
import runSetup from '../../../hooks/lando-run-setup.js';
import getInitOptions from '../../../utils/get-init-options.js';
import getInitBaseOpts from '../../../utils/get-init-base-opts.js';
import getInitOverridesOpts from '../../../utils/get-init-override-opts.js';
import parseInitOptions from '../../../utils/parse-init-options.js';

const showInit = (lando: any, options: any) => {
  console.log((lando as any).cli.makeArt('init'));
  console.log((lando as any).cli.formatData({
    name: options.name,
    location: options.destination,
    recipe: options.recipe,
    docs: `https://docs.lando.dev/config/${options.recipe}.html`,
  }, {format: 'table'}, {border: false}));
  console.log('');
};

const getYaml = (dest: string, options: any, lando: any) => {
  const existingLando = fs.existsSync(dest) ? lando.yaml.load(dest) : {};
  const landoConfig: any = {name: options.name, recipe: options.recipe};
  if (!_.isEmpty(options.webroot)) _.set(landoConfig, 'config.webroot', options.webroot);
  return _.merge(existingLando, landoConfig);
};

const runBuild = (lando: any, options: any = {}, steps: any[] = []) => lando.Promise.each(steps, (step: any) => {
  if (_.has(step, 'func')) {
    return step.func(options, lando);
  } else {
    (step as any).cmd = _.isFunction((step as any).cmd) ? (step as any).cmd(options) : (step as any).cmd;
    return runInit(
      lando,
      getInitRunner(_.merge(
        {},
        getInitRunnerDefaults(lando, options),
        step,
      )),
    );
  }
});

export default class Init extends LandoCommand<typeof Init> {
  static override description = 'Fetches code and/or initializes a Landofile for use with lando';

  static override level = 'app' as const;

  static override examples = [
    '<%= config.bin %> <%= command.id %> --recipe lamp --name myapp',
    '<%= config.bin %> <%= command.id %> --source github --github-repo lando/lando',
  ];

  static override flags = {
    'name': Flags.string({
      char: 'n',
      description: 'The name of the app',
    }),
    'recipe': Flags.string({
      char: 'r',
      description: 'The recipe to use',
    }),
    'source': Flags.string({
      char: 's',
      description: 'The source to get the codebase from',
    }),
    'webroot': Flags.string({
      char: 'w',
      description: 'The webroot relative to the app root',
    }),
    'destination': Flags.string({
      description: 'The destination directory',
      default: process.cwd(),
    }),
    'full': Flags.boolean({
      description: 'Dump a lower level lando file with all the config options',
      default: false,
    }),
    'yes': Flags.boolean({
      char: 'y',
      description: 'Auto-answer yes to prompts',
      default: false,
    }),
    'option': Flags.string({
      description: 'Set config option (path=value)',
      multiple: true,
      default: [],
    }),
    'github-auth': Flags.string({
      description: 'GitHub auth token',
    }),
    'github-repo': Flags.string({
      description: 'GitHub repo URL',
    }),
    'remote-url': Flags.string({
      description: 'Remote URL for source',
    }),
    'remote-options': Flags.string({
      description: 'Remote options',
    }),
  };

  async run(): Promise<void> {
    const inits = (this.lando.config as any).inits;
    const sources = (this.lando.config as any).sources;
    const recipes = (this.lando.config as any).recipes;

    const getConfig = (data: any[] = [], name: string) => _.find(data, {name});

    const configOpts = getInitOptions(inits.concat(sources), this.lando);
    const allOpts = _.merge(getInitBaseOpts(recipes, sources), configOpts, getInitOverridesOpts(inits, recipes, sources));

    let options: any = {
      ...this.flags,
      ...allOpts,
    };

    options = parseInitOptions(options);

    const recipeConfig = getConfig(inits, options.recipe);
    const sourceConfig = getConfig(sources, options.source);

    const buildSteps = _.has(sourceConfig, 'build') ? (sourceConfig as any).build(options, this.lando) : [];
    const configStep = _.has(recipeConfig, 'build') ? (recipeConfig as any).build : () => {};

    await (runSetup as any)(this.lando);

    await this.lando.events.emit('pre-init', options, buildSteps);

    await runBuild(this.lando, options, buildSteps);

    const config = await configStep(options, this.lando);

    if (config !== false) {
      const dest = path.join(options.destination, '.lando.yml');
      const landoFile = getYaml(dest, options, this.lando);

      if (options.full) {
        const Recipe = this.lando.factory.get(options.recipe);
        const recipeConf = _.merge({}, landoFile, {app: landoFile.name, _app: {_config: this.lando.config}});
        _.merge(landoFile, new (Recipe as any)(landoFile.name, recipeConf).config);
      }

      landoFile.config = _.merge((recipeConfig as any)?.defaults ?? {}, landoFile.config);

      _.forEach(options.option, (option: string) => {
        const key = _.first(option.split('='));
        _.set(landoFile, `config.${key}`, _.last(option.split('=')));
      });

      this.lando.yaml.dump(dest, _.merge(landoFile, config));
    }

    showInit(this.lando, options);

    await this.lando.events.emit('post-init', options);
  }
}
