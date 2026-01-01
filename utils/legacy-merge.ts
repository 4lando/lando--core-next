import mergeWith from 'lodash/mergeWith';
import uniq from 'lodash/uniq';

export default (old, ...fresh) => mergeWith(old, ...fresh, (s, f) => {
  if (Array.isArray(s)) return uniq(s.concat(f));
});
