
import _ from 'lodash';

export default version => _.slice(version.split('.'), 0, 2).join('.');
