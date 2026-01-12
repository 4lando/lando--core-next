import camelCase from 'lodash/camelCase';
import tryConvertJson from './try-convert-json.js';

export default prefix => {
  return Object.fromEntries(Object.keys(process.env)
    // filter out keys that dont make sense
    .filter(key => key.startsWith(`${prefix}_`))
    // map to key/pair values
    .map(key => ([
      camelCase(key.replace(`${prefix}_`, '')),
      tryConvertJson(process.env[key]),
    ])));
};
