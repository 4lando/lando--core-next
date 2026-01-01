
export default path => {
  return path.replace(/\\/g, '/').replace(/^([a-zA-Z]):/, '/$1');
};
