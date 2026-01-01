import _ from 'lodash';
import slugifyLib from 'slugify';

export default (data: unknown) => slugifyLib(_.toString(data), {lower: true, strict: true});
