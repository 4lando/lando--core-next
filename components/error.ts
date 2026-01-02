import debug from 'debug';

/**
 * Custom error class for Lando
 */
class LandoError extends Error {
  static id = 'error';
  static debug = debug('@lando/core:error');

  /*
   */
  constructor(message, {
    all = '',
    args = [],
    code = 1,
    command = '',
    context = {},
    stdout = '',
    stderr = '',
    short,
  } = {}) {
    super(message);

    // add other metadata
    this.all = all;
    this.args = args;
    this.code = code;
    this.command = command;
    this.context = context;
    this.short = short ?? message;
    this.stdout = stdout;
    this.stderr = stderr;
  }
}

export default LandoError;
