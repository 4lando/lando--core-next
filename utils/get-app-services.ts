
import _ from 'lodash';

export default composeData => _(composeData)
  .flatMap(data => data.data)
  .flatMap(data => _.keys(data.services))
  .uniq()
  .value();
