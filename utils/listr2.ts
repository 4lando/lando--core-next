import {
  Listr,
  color,
  PRESET_TIMER,
  VerboseRenderer,
  DefaultRenderer,
  ListrEventType,
  ListrTaskEventType,
} from '../node_modules/listr2/dist/index.js';

const figures = {
  tick: '✔',
  cross: '✖',
  warning: '⚠',
  info: 'ℹ',
  pointer: '❯',
  arrowRight: '→',
  arrowDown: '↓',
  line: '─',
  ellipsis: '…',
};

export {
  Listr,
  color,
  figures,
  PRESET_TIMER,
  VerboseRenderer,
  DefaultRenderer,
  ListrEventType,
  ListrTaskEventType,
};
