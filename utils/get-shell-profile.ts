import getSystemShellProfile from './get-system-shell-profile.js';
import getUserShellProfile from './get-user-shell-profile.js';

// @TODO: we really need to use is-elevated instead of is-root but we are ommiting for now since lando
// really cant run elevated anyway and its a bunch of extra effort to make all of this aysnc
// in Lando 4 this will need to be resolved though.
export default () => {
  return isRoot() ? getSystemShellProfile() : getUserShellProfile();
};
