var bichannel = require('../../../muon/infrastructure/channel.js');
var client = require('../../../muon/transport/rabbit/client.js');
var server = require('../../../muon/transport/rabbit/server.js');
var assert = require('assert');
var expect = require('expect.js');
var uuid = require('node-uuid');
var messages = require('../../../muon/domain/messages.js');

describe("muon client/server transport test", function () {

    this.timeout(30000);

      after(function() {
            //bi-channel.closeAll();
      });

    it("client server negotiate handshake", function (done) {
            var serverName = 'server1';
            var clientName = 'client1';
            var url = "amqp://muon:microservices@localhost";


            var serverChannel = bichannel.create("server-stacks");
            var mockServerStacks = {
                openChannel: function() {
                    return serverChannel.rightConnection();
                }
            }



            serverChannel.leftConnection().listen(function(event) {
                    console.log('********** client_server-test.js serverChannel.leftConnection().listen() event.id=' + event.id);
                    console.dir(event);
                    console.log('********** client_server-test.js serverChannel.leftConnection().listen() reply with PONG');
                    var reply = messages.rpcMessage('PONG', clientName, 'muon://client1/reply');
                     messages.validate(reply);
                    serverChannel.leftConnection().send(reply);
            });

            server.connect(serverName, "request", mockServerStacks, url);

        setTimeout(function() {
             var muonClientChannel = client.connect(serverName, url);

            muonClientChannel.listen(function(event){

                console.log('********** client_server-test.js muonClientChannel.listen() event received: ');
                console.dir(event);
                assert.equal(event.payload, 'PONG');
                done();
            });

            var event = messages.rpcMessage("PING", clientName, 'muon://server1/ping');
            muonClientChannel.send(event);
        }, 500)


    });


});