import readFile from './read-file.js';

import fs from 'fs';

export default file => {
  // if the file doesnt exist then return an empty object
  if (!fs.existsSync(file)) return {};
  // otherwise load the file and return it
  return readFile(file);
};

