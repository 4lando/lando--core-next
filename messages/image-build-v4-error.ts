
import _ from 'lodash';
import {color} from '../utils/listr2.js';

const {red, bold} = color;

// checks to see if a setting is disabled
export default error => ({
  title: `Could not build image for "${_.get(error, 'context.id')}!"`,
  type: 'error',
  detail: [
    `Failed with ${red(_.get(error, 'short'))}`,
    `Rerun with ${bold('lando rebuild --debug')} to see the entire build log and look for errors.`,
    `When you've resolved the build issues you can then:`,
  ],
  command: 'lando rebuild',
});
