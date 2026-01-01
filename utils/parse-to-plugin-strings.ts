
// adds required methods to ensure the lando v3 debugger can be injected into v4 things
export default (plugins = {}) => Object.entries(plugins).map(entry => entry.join('@'));
