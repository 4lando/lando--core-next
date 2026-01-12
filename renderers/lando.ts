
import {EOL} from 'os';
import {DefaultRenderer, ListrEventType} from '../utils/listr2.js';
import logUpdate from 'log-update';
import truncate from 'cli-truncate';
import wrap from 'wrap-ansi';

class LandoRenderer extends DefaultRenderer {
  constructor(tasks, options, $renderHook) {
    super(tasks, options, $renderHook);
    this.options.level = options.level ?? 0.5;
  }

  create(options) {
    options = {
      tasks: true,
      bottomBar: true,
      prompt: true,
      ...options,
    };

    options.prompt = true;

    const render = [];

    const renderTasks = this.renderer(this.tasks, this.options.level);
    const renderBottomBar = this.renderBottomBar();
    const renderPrompt = this.renderPrompt();

    if (options.tasks && renderTasks.length > 0) render.push(...renderTasks);

    if (options.bottomBar && renderBottomBar.length > 0) {
      if (render.length > 0) render.push('');
      render.push(...renderBottomBar);
    }

    if (options.prompt && renderPrompt.length > 0) {
      if (render.length > 0) render.push('');
      render.push(...renderPrompt);
    }

    return render.join(EOL);
  }

  async render() {
    this.updater = logUpdate.create(this.logger.process.stdout);
    this.truncate = truncate;
    this.wrap = wrap;
    this.logger.process.hijack();
    if (!this.options?.lazy) {
      this.spinner.start(() => {
        this.update();
      });
    }
    this.events.on(ListrEventType.SHOULD_REFRESH_RENDER, () => {
      this.update();
    });
  }
}

export default LandoRenderer;

