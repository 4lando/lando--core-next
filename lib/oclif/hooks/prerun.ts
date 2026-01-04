import type { Hook } from '@oclif/core';

const hook: Hook<'prerun'> = async function (options) {
  this.debug(`OCLIF prerun hook: ${options.Command.id}`);
};

export default hook;
