#!/usr/bin/env bun
/**
 * Generates static task imports for compiled binary support.
 * Run before `bun build --compile` to bundle tasks into the binary.
 */

import fs from 'fs';
import path from 'path';
import {fileURLToPath} from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const projectRoot = path.resolve(__dirname, '..');
const tasksDir = path.join(projectRoot, 'tasks');
const outputFile = path.join(projectRoot, 'lib', 'task-manifest.ts');

const taskFiles = fs.readdirSync(tasksDir)
  .filter(file => file.endsWith('.ts') || file.endsWith('.js'))
  .filter(file => !file.startsWith('_'))
  .map(file => path.basename(file, path.extname(file)));

const imports = taskFiles.map((name, i) =>
  `import task${i} from '../tasks/${name}';`,
).join('\n');

const taskArray = taskFiles.map((name, i) =>
  `  {name: '${name}', factory: task${i}},`,
).join('\n');

const content = `// AUTO-GENERATED - DO NOT EDIT
${imports}

export interface TaskManifestEntry {
  name: string;
  factory: (lando: any, options: any) => any;
}

export const taskManifest: TaskManifestEntry[] = [
${taskArray}
];

export default taskManifest;
`;

fs.writeFileSync(outputFile, content);
console.log(`Generated task manifest with ${taskFiles.length} tasks: ${outputFile}`);
