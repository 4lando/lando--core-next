import spawnSyncStringer from './spawn-sync-stringer.js';

export default path => {
  const {stdout} = spawnSyncStringer('wslpath', ['-w', path], {encoding: 'utf-8'});
  return stdout.trim();
};
