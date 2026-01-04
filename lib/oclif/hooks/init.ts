import type { Hook } from '@oclif/core';

const hook: Hook<'init'> = async function (options) {
  this.debug('OCLIF init hook running');
};

export default hook;
