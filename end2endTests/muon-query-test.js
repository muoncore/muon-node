
var _ = require("underscore");
var sleep = require('sleep');
var muonCore = require("../index.js");
var sleep = require('sleep');

var amqp = muonCore.amqpTransport("amqp://muon:microservices@msg.cistechfutures.net:5672");

var muonServer = muonCore.muon('node-service', amqp.getDiscovery(), [
    ["my-tag", "tck-service", "node-service"]
]);

muonServer.addTransport(amqp);


setTimeout(function() {
    muonServer.resource.onQuery("/query", "Get the events", function(event, data, respond) {
            console.log('muon node-service server onQuery("/query"): event:', event);
            respond({"echo":"this is the server response"});
        });
},3500);

//sleep.sleep(3);

setTimeout(function() {
    muonServer.resource.query("muon://node-service/query?arg1=foobar&arg2=soa", function(event, payload) {
            console.log('muon node-service client: response event:', event);
            console.log(payload);
        });
},3500);
























