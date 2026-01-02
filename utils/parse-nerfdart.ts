const parseNerfdart = (key, registry = 'https://registry.npmjs.org') => {
  // if this is valid url then should be easy
  try {
    const url = new URL(key);
    const registryHost = `//${url.host}/`;
    const method = url.pathname.split('/:')[1] || url.pathname.split('/')[1] || '_authToken';
    return {registry: registryHost, method};

  // if its not then handle the two cases and recurse
  } catch {
    // if key starts with // then add a bogus protocol and recurse
    if (key.startsWith('//')) return parseNerfdart(`lando:${key}`);
    // key needs default
    else return parseNerfdart(`${registry}/${key}`);
  }
};

export default parseNerfdart;
