var Logger = require('./lib/logging/logger');

module.exports = {
    "muon": require('./core/muon-core.js'),
    "amqpTransport": require("./amqp/muon-transport-amqp.js"),
    "httpTransport": require("./http/muon-transport-http.js")
};
