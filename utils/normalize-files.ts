
import _ from 'lodash';
import fs from 'fs';
import path from 'path';

export default (files = [], base = process.cwd()) => _(files)
  .map(file => (path.isAbsolute(file) ? file : path.join(base, file)))
  .filter(file => fs.existsSync(file))
  .value();
