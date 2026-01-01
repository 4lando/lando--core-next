
/*
 * Attempts to produce a standardized error object
 */
export default ({
  all,
  args,
  command,
  stdout,
  stderr,
}) => ({
  command,
  args,
  exitCode: 0,
  stdout,
  stderr,
  all,
});
