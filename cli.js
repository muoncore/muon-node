#! /usr/bin/env node

var Logger = require('./lib/logging/logger');
var _ = require("underscore");
var uuid = require("node-uuid");
var muonCore = require("./index.js");

var amqp = muonCore.amqpTransport("amqp://localhost:5672");
var muon = muonCore.muon('cli', amqp.getDiscovery(), [
    ["my-tag", "tck-service", "node-service"]
]);

muon.addTransport(amqp);

setTimeout(function() {
    //TODO, get rid of this awful timeout ...

    logger.info("Processed and sent :-)");

    process.exit(0);
}, 3000);








