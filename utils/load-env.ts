import tryConvertJson from './try-convert-json.js';

import _ from 'lodash';

export default prefix => _(process.env)
  // Only muck with prefix_ variables
  .pickBy((value, key) => _.includes(key, prefix))
  // also filter out all pluginConfig so we can handle that elsewhere
  .pickBy((value, key) => !key.startsWith(`${prefix}_PLUGIN_CONFIG`))
  // Prep the keys for consumption
  .mapKeys((value, key) => _.camelCase(_.trimStart(key, prefix)))
  // If we have a JSON string as a value, parse that and assign its sub-keys
  .mapValues(tryConvertJson)
  // Resolve the lodash wrapper
  .value();
