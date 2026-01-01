
import {VerboseRenderer} from 'listr2';
import createDebug from 'debug';

const rendererDebug = createDebug('lando:debug-renderer');

class LandoDebugRenderer extends VerboseRenderer {
  static debug = rendererDebug;

  constructor(tasks, options, $renderHook) {
    super(tasks, options, $renderHook);
    this.options.level = 0;
    const debug = options.log || LandoDebugRenderer.debug;

    // update the logger with our debug wrapper
    this.logger.log = (level, message, options) => {
      const output = debug(this.logger.format(level, message, options));

      if (output && this.logger.options.toStderr.includes(level)) {
        this.logger.process.toStderr(output);
        return;
      }

      if (output) this.logger.process.toStdout(output);
    };
  }
}

export default LandoDebugRenderer;

