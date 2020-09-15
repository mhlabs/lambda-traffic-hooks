const hooks = require('./hooks');

hooks.add('/health', 200);
hooks.add('/ping', 200);

module.exports = hooks;
