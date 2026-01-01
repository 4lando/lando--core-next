
import {nanoid} from 'nanoid';

/*
 * Init Lamp
 */
export default {
  name: 'none',
  defaults: {
    something: 'happening-here',
  },
  overrides: {
    name: {
      when: answers => {
        answers.name = nanoid();
        return false;
      },
    },
    webroot: {when: () => false},
  },
};
