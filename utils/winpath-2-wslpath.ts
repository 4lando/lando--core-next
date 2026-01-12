import spawnSyncStringer from './spawn-sync-stringer.js';

export default path => {
  const {stdout} = spawnSyncStringer('wslpath', ['-u', path], {encoding: 'utf-8'});
  return stdout.trim();
};
