
import _ from 'lodash';

export default prefix => {
  // Strip it down
  _.each(process.env, (value, key) => {
    if (_.includes(key, prefix)) {
      delete process.env[key];
    }
  });

  // Return
  return process.env;
};
