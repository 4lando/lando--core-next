import npa from 'npm-package-arg';

/*
 * TBD
 */
export default plugin => {
  // parse the plugin
  const result = npa(plugin);

  // add a package property
  result.package = result.scope ? result.name.replace(`${result.scope}/`, '') : result.name;

  // if we have an explict non-tag peg then lets set it
  if (result.type !== 'tag') result.peg = result.saveSpec || result.rawSpec;
  else if (result.rawSpec !== '') result.peg = result.rawSpec;

  // return
  return result;
};
