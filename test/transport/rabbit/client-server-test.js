var bichannel = require('../../../muon/infrastructure/channel.js');
var client = require('../../../muon/transport/rabbit/client.js');
var server = require('../../../muon/transport/rabbit/server.js');
var assert = require('assert');
var expect = require('expect.js');
var uuid = require('node-uuid');
var messages = require('../../../muon/domain/messages.js');
var AmqpDiscovery = require("../../../muon/discovery/amqp/amqp-discovery");

describe("muon client/server transport test", function () {

    var serverName = 'server1';
    var clientName = 'client1';
    var url = "amqp://muon:microservices@localhost";
    var discovery = new AmqpDiscovery(url);

    this.timeout(15000);

    var mockServerStacks;

     beforeEach(function() {
        var serverChannel = bichannel.create("server-stacks");
        mockServerStacks = {
            openChannel: function() {
                return serverChannel.rightConnection();
            }
        }

        serverChannel.leftConnection().listen(function(event) {
                console.log('********** client_server-test.js serverChannel.leftConnection().listen() event.id=' + event.id);
                console.dir(event);
                console.log('********** client_server-test.js serverChannel.leftConnection().listen() reply with PONG');
                var reply = messages.rpcMessage('PONG', clientName, 'rpc://client1/reply');
                messages.validate(reply);
                serverChannel.leftConnection().send(reply);
        });
     });

      afterEach(function() {
            //shutdown nicely
      });

     before(function() {

     });

      after(function() {
            //shutdown nicely
      });

    it("client server negotiate handshake", function (done) {

        server.connect(serverName, url, mockServerStacks, discovery);

        // now create a muon client socket to connect to server1:
        console.log('creating muon client..');
        var muonClientChannel = client.connect(serverName, "rpc", url, discovery);
        muonClientChannel.listen(function(event){
            console.log('********** client_server-test.js muonClientChannel.listen() event received: ');
            console.dir(event);
            assert.equal(event.payload, 'PONG');
            done();
        });
         console.dir('sending muon event via client..');
        var event = messages.rpcMessage("PING", clientName, 'rpc://server1/ping');
        muonClientChannel.send(event);

    });


});