import type {Hook} from '@oclif/core';

const hook: Hook<'prerun'> = async function(options) {
  // eslint-disable-next-line no-invalid-this
  this.debug(`OCLIF prerun hook: ${options.Command.id}`);
};

export default hook;
