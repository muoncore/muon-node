var bichannel = require('../../../muon/infrastructure/channel.js');
client = require('../../../muon/transport/rabbit/client.js');
server = require('../../../muon/transport/rabbit/server.js');


var assert = require('assert');
var expect = require('expect.js');

describe("muon client/server transport test", function () {

    this.timeout(4000);

      after(function() {
            //bi-channel.closeAll();
      });

    it("client server negotiate handshake", function (done) {
            var serverName = 'server1';
            var clientName = 'client1';
            var url = "amqp://muon:microservices@localhost";

            var serverChannel = bichannel.create("server-amqp-transport-server");



            serverChannel.leftConnection().listen(function(event) {
                    console.log('********** client_server-test.js serverChannel.leftConnection().listen() event=' + JSON.stringify(event));
                    console.log('********** client_server-test.js serverChannel.leftConnection().listen() reply with PONG');
                    event.payload = 'PONG';
                    serverChannel.leftConnection().send(event);
            });

            server.connect(serverName, serverChannel.rightConnection(), url);

            var muonClientChannel = client.connect(serverName, url);

            muonClientChannel.listen(function(event){

                console.log('********** client_server-test.js muonClientChannel.listen() event received ' + JSON.stringify(event));
                assert.equal(event.payload, 'PONG');
                done();
            });


            muonClientChannel.send({id: "1", payload: "PING"});

    });


});