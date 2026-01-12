import spawnSyncStringer from './spawn-sync-stringer.js';

export default varname => {
  const args = ['-Command', `[Environment]::GetEnvironmentVariable('${varname}')`];
  const {stdout} = spawnSyncStringer('powershell.exe', args, {encoding: 'utf-8'});
  return stdout.trim();
};
