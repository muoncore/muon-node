var muonCore  = require("../index.js");
var sleep = require('sleep');

var amqp = muonCore.amqpTransport("amqp://muon:microservices@msg.cistechfutures.net:5672");



var muonServer = muonCore.muon('node-server', amqp.getDiscovery(), [
    ["my-tag", "tck-service", "node-service"]
]);

muonServer.addTransport(amqp);

muonServer.resource.onQuery("/query", "Get the events", function(event, data, respond) {
        respond({"echo":"this is the server response"});
    });



