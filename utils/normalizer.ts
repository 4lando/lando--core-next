
import _ from 'lodash';

export default data => (!_.isArray(data)) ? [data] : data;
