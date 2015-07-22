var _ = require("underscore");
var sleep = require('sleep');
var muonCore = require("../index.js");
var sleep = require('sleep');
var expect = require('expect.js');
var assert = require('assert');

var amqp = muonCore.amqpTransport("amqp://localhost");

var counterServer = muonCore.muon('counter', amqp.getDiscovery(), [
    ["increment", "integer", "counter"]
]);

counterServer.addTransport(amqp);

var counter = 1;

counterServer.resource.onQuery("/next", "Get next number", function(event, data, respond) {
        var next = counter;
        //console.log('counter service running on onQuery("/next"): number:', next);
        counter++;
        respond(next);
});




for (var i = 0 ; i < 100 ; i++) {
    counterServer.resource.query('muon://counter/next', function(event, payload) {
                        console.log('counter client: next id: ', payload);
    });

}



console.log('finished');































