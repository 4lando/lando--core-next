
import _ from 'lodash';

export default mount => _.dropRight(mount.split(':')).join(':');
