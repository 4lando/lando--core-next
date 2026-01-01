import legacyPluginNotice from '../messages/legacy-plugin-notice.js';

// Plugin uses CommonJS - keep require until components/ is converted
const Plugin = require('../components/plugin');

export default async app => {
  const legacyPlugins = app.plugins.registry
    .map(plugin => new Plugin(plugin.dir))
    .filter(plugin => plugin.legacyPlugin)
    .map(plugin => plugin.name);

  // add legacy plugin notice if needed:
  if (legacyPlugins.length > 0) {
    app.addMessage(legacyPluginNotice(legacyPlugins));
  }
};

// https://docs.lando.dev/guides/updating-plugins-v4.html#lando-3-21-0
