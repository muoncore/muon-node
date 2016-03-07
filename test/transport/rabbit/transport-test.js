var amqpTransport = require('../../../muon/transport/rabbit/transport.js');
var assert = require('assert');
var expect = require('expect.js');
var ServerStacks = require("../../../muon/api/server-stacks");
var eventTemplate = require('../../../muon/domain/events.js');
var bichannel = require('../../../muon/infrastructure/channel.js');

describe("muon client/server transport test", function () {

    this.timeout(4000);

      after(function() {
            //bi-channel.closeAll();
      });

    it("client server negotiate handshake", function (done) {
            var server = 'transport-test-server';
            var url = "amqp://muon:microservices@localhost";
             var event = eventTemplate.rpcEvent("PING", 'testclient', 'muon://' + server + '/ping', 'application/json');

            var fakeServerStackChannel = bichannel.create("fake-serverstacks");
            var fakeServerStacks = {
                openChannel: function() {
                    return fakeServerStackChannel.rightConnection();
                }
            }
            var muonTransport  = amqpTransport.create(server, fakeServerStacks, url);
            var transportChannel = muonTransport.openChannel(server, 'test-rpc-protocol-(totally made up, not yet implemented)');

            transportChannel.send(event);

             console.log('wait for response from remote service ' + server);
            fakeServerStackChannel.leftConnection().listen(function(event){
                console.log('********** transport.js transportChannel.listen() event received ' + JSON.stringify(event));
                assert.equal(event.payload.data, 'PING');
                done();
            });



    });


});