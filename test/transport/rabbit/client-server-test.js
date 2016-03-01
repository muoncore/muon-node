client = require('../../../muon/transport/rabbit/client-queue.js');
server = require('../../../muon/transport/rabbit/server-queue.js');
var bichannel = require('../../../muon/infrastructure/channel.js');

var assert = require('assert');
var expect = require('expect.js');

describe("Bi directional channel test", function () {

    this.timeout(4000);


      after(function() {
            //bi-channel.closeAll();
      });




    it("client server negotiate handshake", function (done) {
            var url = "amqp://muon:microservices@localhost";

            var clientChannel = bichannel.create("cleint");
            var muonClient = client.connect('server', clientChannel.rightConnection(), url);

            var serverChannel = bichannel.create("server");
            var muonServer = server.connect('server', serverChannel.rightConnection(), url);

            clientChannel.leftConnection().listen(function(msg){
                var event = JSON.parse(msg.content);
                console.log('client_server-test.js clientChannel msg recv');
                assert.equal(event.payload, 'handshake_accepted');
                done();
            });

    });


});