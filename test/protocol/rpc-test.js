var bichannel = require('../../muon/infrastructure/channel.js');
var rpc = require('../../muon/protocol/rpc.js');
var assert = require('assert');
var expect = require('expect.js');
var messages = require('../../muon/domain/messages.js');


describe("test rpc protocol:", function () {

    var text = 'Hello, world!';
    var clientName = 'client';
     var serverName = 'server';
     var requestUrl = 'rpc://server/endpoint';

    it("rpc api handler happy path", function (done) {
         var rpcApi = rpc.getApi('server');

         rpcApi.handle(requestUrl, function(request) {
              console.log('rpcApi.handle() called');
              assert.equal(text, request.body);
              done();
         });

         var serverApiChannel = bichannel.create("serverapi");
         var serverTransportChannel = bichannel.create("server-transport");

         var rpcServerProtocol = rpcApi.protocolHandler().server(serverApiChannel.leftConnection());
         serverApiChannel.rightHandler(rpcServerProtocol);
         serverTransportChannel.leftHandler(rpcServerProtocol);


        var muonMessage = messages.muonMessage(text, clientName, requestUrl);
        serverTransportChannel.rightSend(muonMessage);

    });



});

