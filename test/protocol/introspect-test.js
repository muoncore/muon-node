var bichannel = require('../../muon/infrastructure/channel.js');
var rpc = require('../../muon/protocol/rpc.js');
var assert = require('assert');
var expect = require('expect.js');
var messages = require('../../muon/domain/messages.js');


describe("test introspect protocol:", function () {

    var clientName = 'client';
     var serverName = 'server';

    it("can call introspect", function (done) {
         var rpcApi = rpc.getApi('server');

         rpcApi.handle(requestUrl, function(request, respond) {
              console.log('rpcApi.handle() called');
             logger.info("request is " + JSON.stringify(request))
              assert.equal(requestText, request.body);
              respond(responseText);
         });

         var serverApiChannel = bichannel.create("serverapi");
         var serverTransportChannel = bichannel.create("server-transport");

         var rpcServerProtocol = rpcApi.protocolHandler().server(serverApiChannel.leftConnection());
         serverApiChannel.rightHandler(rpcServerProtocol);
         serverTransportChannel.leftHandler(rpcServerProtocol);

        var rpcClientRequest = {
            body: messages.encode(requestText),
            url: requestUrl,
            content_type: 'text/plain',

        }
        var muonMessage = messages.muonMessage(rpcClientRequest, clientName, 'server', "response.sent");
        serverTransportChannel.rightSend(muonMessage);


        serverTransportChannel.rightConnection().listen(function(msg) {
                          console.dir(msg);
                          var response = messages.decode(msg.payload, msg.content_type);
                          var responseBody = messages.decode(response.body, msg.content_type)
                          assert.equal(responseText, responseBody);
                          done();
        });

    });

});

