var _ = require("underscore");
var sleep = require('sleep');
var muonCore = require("../index.js");
var sleep = require('sleep');
var expect = require('expect.js');
var assert = require('assert');

var amqp = muonCore.amqpTransport("amqp://muon:microservices@msg.cistechfutures.net:5672");

var muonServer = muonCore.muon('node-service', amqp.getDiscovery(), [
    ["my-tag", "tck-service", "node-service"]
]);

muonServer.addTransport(amqp);

var params = {'name': 'bob', 'email': 'bob@sky.com'};
var serverMessage = 'muon node server';

describe("Simple muon resource client/server test", function () {

    this.timeout(7000);

    before(function() {
        startServer();
    });

    it("server echoes back client query parameters", function (done) {

            muonServer.resource.query('muon://node-service/query?name=' + params.name + '&email=' + params.email, function(event, payload) {
                    console.log('muon node-service client: response event: ', event);
                    console.log('muon node-service client: response payload :',payload);

                        assert.equal(payload.message, serverMessage, 'server response message');
                        assert.equal(payload.params.name, params.name, 'user name');
                        assert.equal(payload.params.email, params.email, 'user email');
                        done();

                });
    });

});


function startServer() {

    muonServer.resource.onQuery("/query", "Get the events", function(event, data, respond) {
            console.log('muon node-service server onQuery("/query"): event:', event);
            respond({'message': serverMessage, 'params': event.headers.qparams});
        });
}
