import type { Hook } from '@oclif/core';

const hook: Hook<'postrun'> = async function (options) {
  this.debug(`OCLIF postrun hook: ${options.Command.id}`);
};

export default hook;
