import type {Hook} from '@oclif/core';

const hook: Hook<'init'> = async function() {
  this.debug('OCLIF init hook running'); // eslint-disable-line no-invalid-this
};

export default hook;
