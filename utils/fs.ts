/* eslint-disable require-jsdoc */
/**
 * Wrapper around native fs to replace fs-extra for Bun compile compatibility.
 * fs-extra uses CommonJS dynamic requires that don't bundle properly.
 */
import fs from 'node:fs';

// Explicitly export the fs functions we use (star export breaks Bun compile)
export const {
  existsSync,
  mkdirSync,
  readdirSync,
  readFileSync,
  writeFileSync,
  statSync,
  lstatSync,
  unlinkSync,
  rmdirSync,
  rmSync,
  renameSync,
  chmodSync,
  chownSync,
  symlinkSync,
  readlinkSync,
  accessSync,
  constants,
} = fs;

export default fs;

/**
 * Synchronously copy a file or directory.
 * This is a replacement for fs-extra's copySync.
 * @param {string} src - Source path
 * @param {string} dest - Destination path
 * @param {object} options - Copy options
 */
export const copySync = (
  src: string,
  dest: string,
  options: {
    dereference?: boolean;
    overwrite?: boolean;
    filter?: (src: string, dest: string) => boolean;
  } = {},
): void => {
  const {dereference = false, overwrite = true, filter} = options;

  fs.cpSync(src, dest, {
    dereference,
    force: overwrite,
    recursive: true,
    filter,
  });
};
