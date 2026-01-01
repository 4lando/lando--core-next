
import fs from 'fs';
import merge from 'lodash/merge';
import read from './read-file.js';

export default (file, config = {}) => {
  // if config file exists then rebase config on top of it
  if (fs.existsSync(file)) return merge({}, read(file), config);
  // otherwise return config alone
  return config;
};
