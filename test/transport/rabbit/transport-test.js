var amqpTransport = require('../../../muon/transport/rabbit/transport.js');
var assert = require('assert');
var expect = require('expect.js');
var messages = require('../../../muon/domain/messages.js');
var bichannel = require('../../../muon/infrastructure/channel.js');
var builder = require("../../../muon/infrastructure/builder");
 var AmqpDiscovery = require("../../../muon/discovery/amqp/amqp-discovery");


describe("muon client/server transport test", function () {

    this.timeout(10000);

      after(function() {
            //bi-channel.closeAll();
      });

    it("client server negotiate handshake", function (done) {
            var server = 'transport-test-server';
            var url = "amqp://muon:microservices@localhost";

             var event = messages.rpcMessage("PING", 'testclient', 'muon://' + server + '/ping');

            var fakeServerStackChannel = bichannel.create("fake-serverstacks");
            var fakeServerStacks = {
                openChannel: function() {
                    return fakeServerStackChannel.rightConnection();
                }
            }
            var discovery = new AmqpDiscovery(url);
            var muonTransport  = amqpTransport.create(server, url, fakeServerStacks, discovery);
            var transportChannel = muonTransport.openChannel(server, 'test-rpc-protocol-(totally made up, not yet implemented)');

            transportChannel.send(event);

             console.log('wait for response from remote service ' + server);
            fakeServerStackChannel.leftConnection().listen(function(event){
                console.log('********** transport.js transportChannel.listen() event received ' + JSON.stringify(event));
                assert.equal(event.payload, 'PING');
                done();
            });



    });


});