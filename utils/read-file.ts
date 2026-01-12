import yaml from '../components/yaml.js';
import jsonfile from 'jsonfile';

import fs from 'fs';
import path from 'path';

export default (file, options = {}) => {
  // @TODO: file does nto exist?

  // set extension if not set
  const extension = options.extension || path.extname(file);

  // @TODO: better try/catches here?
  // @TODO: throw error for default?
  switch (extension) {
    case '.yaml':
    case '.yml':
    case 'yaml':
    case 'yml':
      return yaml.load(fs.readFileSync(file, 'utf8'), options);
    case '.js':
    case 'js':
      // Dynamic require for loading arbitrary .js files at runtime - must stay as require()
      // since the file path is user-provided and not known at build time
      return require(file);
    case '.json':
    case 'json':
      return jsonfile.readFileSync(file, options);
    default:
      return fs.readFileSync(file, 'utf8');
  }
};
