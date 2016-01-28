
require('mocha-sinon');
var sinon = require("sinon");
var assert = require('assert');
var url = require('url');
var _ = require('underscore');
var AmqpDiscovery = require("../../muon/discovery/amqp/amqp-discovery.js");

describe("AMQP Discovery", function () {

    var discovery;

    beforeEach(function() {

    });

    it("Discoveries can locate each other over the amqp broker", function (done) {
        this.timeout(25000);

        var discovery1 = new AmqpDiscovery("amqp://muon:microservices@localhost");
        var discovery2 = new AmqpDiscovery("amqp://muon:microservices@localhost");
        var discovery3 = new AmqpDiscovery("amqp://muon:microservices@localhost");

        discovery1.advertiseLocalService({
            identifier:"tombola",
            tags:["node", "tombola"],
            codecs:["application/json"],
            connectionUrls:["amqp://muon:microservices@localhost"]
        });
        discovery2.advertiseLocalService({
            identifier:"simple",
            tags:["node", "tombola"],
            codecs:["application/json"],
            connectionUrls:["amqp://muon:microservices@localhost"]
        });
        discovery3.advertiseLocalService({
            identifier:"awesomeService",
            tags:["node", "tombola"],
            codecs:["application/json"],
            connectionUrls:["amqp://muon:microservices@localhost"]
        });

        setTimeout(function() {

            discovery1.discoverServices(function(data) {
                console.log("Have data from service discovery");
                console.dir(data);
                assert.equal(data.length, 3);
                done();
            });
        }, 10000);

    });
});