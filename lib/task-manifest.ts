// AUTO-GENERATED - DO NOT EDIT
import task0 from '../tasks/version';
import task1 from '../tasks/list';
import task2 from '../tasks/stop';
import task3 from '../tasks/update';
import task4 from '../tasks/plugin-logout';
import task5 from '../tasks/shellenv';
import task6 from '../tasks/info';
import task7 from '../tasks/start';
import task8 from '../tasks/restart';
import task9 from '../tasks/plugin-add';
import task10 from '../tasks/destroy';
import task11 from '../tasks/logs';
import task12 from '../tasks/plugin-login';
import task13 from '../tasks/share';
import task14 from '../tasks/rebuild';
import task15 from '../tasks/ssh';
import task16 from '../tasks/init';
import task17 from '../tasks/setup';
import task18 from '../tasks/exec';
import task19 from '../tasks/config';
import task20 from '../tasks/poweroff';
import task21 from '../tasks/plugin-remove';

export interface TaskManifestEntry {
  name: string;
  factory: (lando: any, options: any) => any;
}

export const taskManifest: TaskManifestEntry[] = [
  {name: 'version', factory: task0},
  {name: 'list', factory: task1},
  {name: 'stop', factory: task2},
  {name: 'update', factory: task3},
  {name: 'plugin-logout', factory: task4},
  {name: 'shellenv', factory: task5},
  {name: 'info', factory: task6},
  {name: 'start', factory: task7},
  {name: 'restart', factory: task8},
  {name: 'plugin-add', factory: task9},
  {name: 'destroy', factory: task10},
  {name: 'logs', factory: task11},
  {name: 'plugin-login', factory: task12},
  {name: 'share', factory: task13},
  {name: 'rebuild', factory: task14},
  {name: 'ssh', factory: task15},
  {name: 'init', factory: task16},
  {name: 'setup', factory: task17},
  {name: 'exec', factory: task18},
  {name: 'config', factory: task19},
  {name: 'poweroff', factory: task20},
  {name: 'plugin-remove', factory: task21},
];

export default taskManifest;
