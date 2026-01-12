import isGroupMember from './is-group-member.js';

import os from 'os';

export default (user, {platform = process.platform} = {}) => {
  // set user to person running this process if its not set
  if (!user) user = os.userInfo().username;

  // differetn strokes, different folks
  switch (platform) {
    case 'darwin':
      return isGroupMember('admin', user, platform);
    case 'linux':
      return isGroupMember('sudo', user, platform)
        || isGroupMember('admin', user, platform)
        || isGroupMember('wheel', user, platform)
        || isGroupMember('adm', user, platform);
    case 'win32':
      return isGroupMember('S-1-5-32-544', user, platform)
        || isGroupMember('administrators', user, platform);
    default:
      return false;
  }
};
