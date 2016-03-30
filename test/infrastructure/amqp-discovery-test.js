
require('mocha-sinon');
var sinon = require("sinon");
var assert = require('assert');
var url = require('url');
var expect = require('expect.js');
var _ = require('underscore');
var AmqpDiscovery = require("../../muon/discovery/amqp/amqp-discovery.js");
require('sexylog');

var discovery1;
var discovery2;
var discovery3;

describe("AMQP Discovery", function () {

    var discovery;

    afterEach(function() {
        discovery1.close();
        discovery2.close();
        discovery3.close();
    });

    it("Discoveries can locate each other over the amqp broker", function (done) {
        this.timeout(25000);

        discovery1 = new AmqpDiscovery("amqp://muon:microservices@localhost");
        discovery2 = new AmqpDiscovery("amqp://muon:microservices@localhost");
        discovery3 = new AmqpDiscovery("amqp://muon:microservices@localhost");

        discovery1.advertiseLocalService({
            identifier:"tombola",
            tags:["node", "tombola"],
            codecs:["application/json"],
            connectionUrls:["amqp://muon:microservices@localhost"]
        });
        discovery2.advertiseLocalService({
            identifier:"simple",
            tags:["node", "simple"],
            codecs:["application/json"],
            connectionUrls:["amqp://muon:microservices@localhost"]
        });
        discovery3.advertiseLocalService({
            identifier:"awesomeService",
            tags:["node", "awesomeService"],
            codecs:["application/json"],
            connectionUrls:["amqp://muon:microservices@localhost"]
        });

        setTimeout(function() {

            discovery1.discoverServices(function(data) {
                //console.log("Have data from service discovery");
                //console.dir(data);
                   var servicesFound = {
                            tombola: '.',
                            simple: '.',
                            awesomeService: '.'
                   }

                for (var i = 0 ; i < data.length ; i++) {
                       var service = data[i];
                       var serviceName = service.identifier;
                       console.log('found serviceName: ' + serviceName);
                       if (servicesFound[serviceName] === '.') {
                         servicesFound[serviceName] = true;
                       }

                }
                //console.dir(servicesFound);
               for (var key in servicesFound) {
                    assert.equal(true, servicesFound[serviceName], 'did not find service "' + serviceName + '" in discovery list');
               }

                done();
            });
        }, 6000);

    });

});