import yaml from '../components/yaml.js';
import jsonfile from 'jsonfile';

import fs from 'fs';
import get from 'lodash/get';
import path from 'path';

// @TODO: maybe extension should be in {options}?
// @TODO: error handling, defaults etc?
export default (file, data, options = {}) => {
  // set extension if not set
  const extension = options.extension || path.extname(file);
  // linux line endings
  const forcePosixLineEndings = options.forcePosixLineEndings ?? false;

  // special handling for ImportString
  if (typeof data !== 'string' && data?.constructor?.name === 'ImportString') data = data.toString();

  // data is a string and posixOnly then replace
  if (typeof data === 'string' && forcePosixLineEndings) data = data.replace(/\r\n/g, '\n');

  switch (extension) {
    case '.yaml':
    case '.yml':
    case 'yaml':
    case 'yml':
      // if this is a YAML DOC then use yaml module
      if (get(data, 'constructor.name') === 'Document') {
        try {
          fs.writeFileSync(file, data.toString());
        } catch (error) {
          throw new Error(error);
        }

      // otherwise use the normal js-yaml dump
      } else {
        try {
          fs.writeFileSync(file, yaml.dump(data, options));
        } catch (error) {
          throw new Error(error);
        }
      }
      break;
    case '.json':
    case 'json':
      jsonfile.writeFileSync(file, data, {spaces: 2, ...options});
      break;
    default:
      if (!fs.existsSync(file)) fs.mkdirSync(path.dirname(file), {recursive: true});
      fs.writeFileSync(file, data, {encoding: 'utf-8'});
  }
};
