
import _ from 'lodash';
import fs from 'fs';
import path from 'path';

export default (files, base = process.cwd()) => {
  _.forEach(files, file => {
    fs.chmodSync(path.join(base, file), '755');
  });
};
