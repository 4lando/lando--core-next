import normalizeFiles from './normalize-files.js';

import _ from 'lodash';
import Yaml from '../lib/yaml.js';
const yaml = new Yaml();

export default (files, dir) => _(normalizeFiles(files, dir))
  .map(file => yaml.load(file))
  .value();
