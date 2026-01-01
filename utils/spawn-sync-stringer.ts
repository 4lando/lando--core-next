
import {spawnSync} from 'child_process';

export default (...args) => {
  const result = spawnSync(...args);

  // stringify and trim
  result.stdout = result.stdout.toString().trim();
  result.stderr = result.stderr.toString().trim();
  return result;
};
