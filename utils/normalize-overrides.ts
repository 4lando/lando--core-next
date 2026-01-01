import getHostPath from './get-host-path.js';
import normalizePath from './normalize-path.js';

import _ from 'lodash';

export default (overrides, base = '.', volumes = {}) => {
  // Normalize any build paths
  if (_.has(overrides, 'build')) {
    if (_.isObject(overrides.build) && _.has(overrides, 'build.context')) {
      overrides.build.context = normalizePath(overrides.build.context, base);
    } else {
      overrides.build = normalizePath(overrides.build, base);
    }
  }
  // Normalize any volumes
  if (_.has(overrides, 'volumes')) {
    overrides.volumes = _.map(overrides.volumes, volume => {
      if (!_.includes(volume, ':')) {
        return volume;
      } else {
        const local = getHostPath(volume);
        const remote = _.last(volume.split(':'));
        // @TODO: I don't think below does anything?
        const excludes = _.keys(volumes).concat(_.keys(volumes));
        const host = normalizePath(local, base, excludes);
        return [host, remote].join(':');
      }
    });
  }
  return overrides;
};
