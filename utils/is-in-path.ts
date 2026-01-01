
import path from 'path';
import fs from 'fs';

export default file => {
  const dirstring = process?.env?.PATH ?? [];
  const dirs = dirstring.split(path.delimiter);
  return fs.lstatSync(file).isDirectory() ? dirs.includes(file) : dirs.includes(path.dirname(file));
};
