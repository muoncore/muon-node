var amqpTransport = require('../../../muon/transport/amqp/transport.js');
var assert = require('assert');
var expect = require('expect.js');
var messages = require('../../../muon/domain/messages.js');
var bichannel = require('../../../muon/infrastructure/channel.js');
var builder = require("../../../muon/infrastructure/builder");
 var AmqpDiscovery = require("../../../muon/discovery/amqp/discovery");


describe("muon client/server transport test", function () {

    this.timeout(10000);

      after(function() {
            //bi-channel.closeAll();
      });

    it("client server negotiate handshake", function (done) {
            var server = 'transport-test-server';
            var url = "amqp://muon:microservices@localhost";

             var event = messages.muonMessage("PING", 'testclient', 'server',  'rpc', "request.made");

            var fakeServerStackChannel = bichannel.create("fake-serverstacks");
            var fakeServerStacks = {
                openChannel: function() {
                    return fakeServerStackChannel.rightConnection();
                }
            }
            var discovery = new AmqpDiscovery(url);
            var muonPromise  = amqpTransport.create(server, url, fakeServerStacks, discovery);

            muonPromise.then(function (muonTransport) {
              var transportChannel = muonTransport.openChannel(server, 'rpc');
              transportChannel.send(event);
               console.log('test: wait for response from remote service ' + server);
              fakeServerStackChannel.leftConnection().listen(function(event){
                  console.log('********** transport.js transportChannel.listen() event received ' + JSON.stringify(event));
                  var payload = messages.decode(event.payload);


                  console.log('test: typeof event.payload: ' + (typeof event.payload));
                  assert.equal(payload, 'PING');
                  done();
              });
            });





    });



});
