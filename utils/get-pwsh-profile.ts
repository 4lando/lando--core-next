import spawnSyncStringer from './spawn-sync-stringer.js';

export default () => {
  // @TODO: we really need to use is-elevated instead of is-root but we are ommiting for now since lando
  // really cant run elevated anyway and its a bunch of extra effort to make all of this aysnc
  // in Lando 4 this will need to be resolved though.
  try {
    const {stdout} = spawnSyncStringer(
      'powershell.exe',
      ['-Command', 'echo', isRoot() ? '$PROFILE.AllUsersAllHosts' : '$PROFILE'],
      {encoding: 'utf-8'},
    );
    return stdout.trim();
  } catch {
    return '';
  }
};
