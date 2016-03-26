var bichannel = require('../../../muon/infrastructure/channel.js');
var client = require('../../../muon/transport/rabbit/client.js');
var server = require('../../../muon/transport/rabbit/server.js');
var assert = require('assert');
var expect = require('expect.js');
var uuid = require('node-uuid');
var events = require('../../../muon/domain/events.js');

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
                    var reply = events.rpcEvent("PONG", clientName, 'muon://client1/reply', 'application/json');
                     events.validate(reply);
                    serverChannel.leftConnection().send(reply);
            });

            server.connect(serverName, serverChannel.rightConnection(), url);

            var muonClientChannel = client.connect(serverName, url);

            muonClientChannel.listen(function(event){

                console.log('********** client_server-test.js muonClientChannel.listen() event received ' + JSON.stringify(event));
                assert.equal(event.payload.data, 'PONG');
                done();
            });

            var event = events.rpcEvent("PING", clientName, 'muon://server1/ping', 'application/json');
            muonClientChannel.send(event);

    });


});