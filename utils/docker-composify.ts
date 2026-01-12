
import _ from 'lodash';

export default data => _.toLower(data).replace(/_|-|\.+/g, '');
