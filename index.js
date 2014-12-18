module.exports = {
    "muon": require('./muon/muon-core.js'),
    "amqpTransport": require("./muon/muon-transport-amqp.js"),
    "httpTransport": require("./muon/muon-transport-http.js"),
    "dummyTransport": require("./muon/muon-transport-dummy.js")
};
