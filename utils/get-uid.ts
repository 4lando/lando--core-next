
import _ from 'lodash';
import os from 'os';

export default () => (process.platform === 'win32') ? '1000' : _.toString(os.userInfo().uid);
