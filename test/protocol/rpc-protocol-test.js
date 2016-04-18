var channel = require('../../muon/infrastructure/channel.js');
var rpc = require('../../muon/protocol/rpc-protocol.js');
var assert = require('assert');
var expect = require('expect.js');
var messages = require('../../muon/domain/messages.js');


describe("test rpc protocol:", function () {


    it("send receive rpc message ok", function (done) {
            var serviceName = 'client';
            var url = 'rpc://server/ping';
          var downstreamChannel = channel.create("downstream");
         var upstreamChannel = channel.create("upstream");
         var rpcProtocolHandler = rpc.newHandler(serviceName, url);
         upstreamChannel.rightHandler(rpcProtocolHandler);
         downstreamChannel.leftHandler(rpcProtocolHandler);

         // simulate server 404 failure response
         downstreamChannel.rightConnection().listen(function(message) {
            console.log('downstreamChannel received message: ' + JSON.stringify(message));
             var errorMessage = messages.serverFailure(message, 'rpc', '404', 'resource not found /ping');
             console.log('downstreamChannel sending errorMessage: ' + JSON.stringify(errorMessage));
            downstreamChannel.rightConnection().send(errorMessage);
         });

         upstreamChannel.leftConnection().listen(function(message) {
            console.log('***** upstreamChannel received message *****');
            console.dir(message);
            assert.equal(message.status, '404');
            assert.deepEqual(message.body, {});
            assert.equal(message.error.message, 'resource not found /ping');
            done();
         });

         upstreamChannel.leftConnection().send('PING');


    });



});

