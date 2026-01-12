import _ from 'lodash';
import {createRequire} from 'module';
import fs from 'fs';
import inquirer from 'inquirer';
import inquirerAutocomplete from 'inquirer-autocomplete-prompt';
import os from 'os';
import util from 'util';
import {ux} from '@oclif/core';
import getObjectKeys from '../utils/get-object-keys.js';
import prettify from '../utils/prettify.js';
import Table from './table.js';

const require = createRequire(import.meta.url);

// Const
const formats = ['default', 'json', 'table'];
const formatOpts = {
  format: {
    describe: `Outputs in given format: ${formats.join(', ')}`,
    choices: formats,
    string: true,
  },
  path: {
    describe: 'Returns the value at the given path',
    default: null,
    string: true,
  },
  filter: {
    describe: 'Filters data by "key=value"',
    array: true,
  },
};

/*
 * Format data
 */
export const formatData = (data, {path = '', format = 'default', filter = []} = {}, opts = {}) => {
  // Attempt to filter if we can
  if (_.isArray(data) && !_.isEmpty(filter)) {
    const filters = _(filter).map(f => f.split('=')).fromPairs().value();
    data = _.filter(data, filters);
  }
  // Attempt to get a path if we can
  if (_.isObject(data) && !_.isEmpty(path)) {
    data = _.get(data, path, data);
  }
  switch (format) {
    case 'json':
      return JSON.stringify(data);
    case 'otable': {
      // rows
      const rows = getObjectKeys(data, {expandArrays: false}).map(key => ({key, value: _.get(data, key)}));
      // columes
      const columns = {key: {}, value: {get: row => prettify(row.value)}};

      // in order to keep this API consistent with return we need to hack console.log
      // so we can get the table output in a string
      let output = '';
      const ogcl = console.log;
      console.log = data => output += `${data}\n`;

      // print table
      ux.ux.table(_.sortBy(rows, 'key'), columns);
      // restore
      console.log = ogcl;
      // return
      return output;
    }
    case 'table': {
      if (!_.isArray(data)) {
        const table = new Table(data, opts);
        return table.toString();
      }
      return _(data)
        .map(value => new Table(value, opts))
        .map(table => table.toString())
        .thru(data => data.join(os.EOL))
        .value();
    }
    default:
      return util.inspect(data, {
        colors: process.stdout.isTTY,
        depth: 10,
        compact: true,
        sorted: _.get(opts, 'sort', false),
      });
  }
};

/*
 * FormatOptios
 */
export const formatOptions = (omit = []) => _.omit(formatOpts, omit);

/*
 * Helper to get interactive options
 */
export const getInteractive = (options, argv) => _(options)
  .map((option, name) => _.merge({}, {name}, {option}))
  .filter(option => !_.isEmpty(_.get(option, 'option.interactive', {})))
  .map(option => _.merge({}, {name: option.name, weight: 0}, option.option.interactive))
  .map(option => {
    if (_.isNil(argv[option.name]) || argv[option.name] === false) return option;
    else {
      return _.merge({}, option, {when: answers => {
        answers[option.name] = argv[option.name];
        return false;
      }});
    }
  })
  .value();

/*
 * Helper to prompt the user if needed
 */
export const handleInteractive = (inquiry, argv, command, lando, file) => lando.Promise.try(() => {
  if (_.isEmpty(inquiry)) return {};
  else {
    inquirer.registerPrompt('autocomplete', inquirerAutocomplete);

    // mix in the full task object so we can load in functions and that sort of thing
    if (file && fs.existsSync(file)) {
      // find index of task
      const tid = lando.tasks.findIndex(task => task.command === command);
      // replace
      const taskModule = require(file);
      const taskFn = taskModule.default || taskModule;
      lando.tasks[tid] = taskFn(lando, lando.appConfig);
    }

    // Try to rebuild the inquiry if this is app level bootstrap and we have an app
    if (!_.isEmpty(argv._app) && lando._bootstrap === 'engine') {
      // get id
      const getId = command => {
        if (typeof command === 'string') return command.split(' ')[0];
        return command;
      };
      const tooling = _(_.get(argv, '_app.tooling', {}))
        .map((tooling, command) => _.merge({}, tooling, {command}))
        .concat(lando.tasks)
        .map(command => _.merge({}, command, {id: command.id || getId(command.command)}))
        .value();

      const task = _.find(tooling, {command}) || _.find(tooling, {id: command});

      inquiry = getInteractive(task.options, argv);
      return inquirer.prompt(_.sortBy(inquiry, 'weight'));
    }

    // Try to rebuild the inquiry if this is app level bootstrap and we have an app
    if (!_.isEmpty(argv._app) && lando._bootstrap === 'app') {
      // NOTE: We need to clone deep here otherwise any apps with interactive options get 2x all their events
      // NOTE: Not exactly clear on why app here gets conflated with the app returned from lando.getApp
      const app = _.cloneDeep(lando.getApp(argv._app.root));
      return app.init().then(() => {
        inquiry = getInteractive(_.find(app.tasks.concat(lando.tasks), {command: command}).options, argv);
        return inquirer.prompt(_.sortBy(inquiry, 'weight'));
      });

    // Otherwise just run
    } else {
      inquiry = getInteractive(_.find(lando.tasks, {command: command}).options, argv);
      return inquirer.prompt(_.sortBy(inquiry, 'weight'));
    }
  }
});

/*
 * Helper to sort options
 */
export const sortOptions = options => _(options)
  .keys()
  .sortBy()
  .map(key => [key, options[key]])
  .fromPairs()
  .value();

export default {
  formatData,
  formatOptions,
  getInteractive,
  handleInteractive,
  sortOptions,
};
