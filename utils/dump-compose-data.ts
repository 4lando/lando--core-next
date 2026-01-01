
import _ from 'lodash';
import path from 'path';
import Yaml from '../lib/yaml.js';
const yaml = new Yaml();

export default (data, dir) => _(_.flatten([data]))
  .flatMap(group => _.map(group.data, (compose, index) => ({data: compose, file: `${group.id}-${index}.yml`})))
  .map(compose => yaml.dump(path.join(dir, compose.file), compose.data))
  .value();
