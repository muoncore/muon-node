var bichannel = require('../../muon/infrastructure/channel.js');
var rpc = require('../../muon/protocol/rpc.js');
var assert = require('assert');
var expect = require('expect.js');
var messages = require('../../muon/domain/messages.js');


describe("test rpc protocol:", function () {

    var requestText = 'Hello, world!';
    var responseText = 'Goodbye, world!';
    var clientName = 'client';
     var serverName = 'server';
     var requestUrl = 'rpc://server/endpoint';

    it("rpc server api  handler request happy path", function (done) {
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
            body: requestText,
            url: requestUrl,
            content_type: 'text/plain',

        }
        var muonMessage = messages.muonMessage(rpcClientRequest, clientName, requestUrl, "response.sent");
        serverTransportChannel.rightSend(muonMessage);


        serverTransportChannel.rightConnection().listen(function(msg) {
                          var response = messages.decode(msg.payload, msg.content_type);
                          assert.equal(responseText, response.body);
                          done();
        });

    });







    it("rpc serverside protocol with two endpoint handlers", function (done) {
         var rpcApi = rpc.getApi('server');

         var calls = {
            endpoint1: 0,
            endpoint2: 0,
         };

         var callDone = function() {
            logger.rainbow('callDone() returned calls: ' + JSON.stringify(calls));
            if ( calls.endpoint1 == 1 &&  calls.endpoint2 == 1 ) {
                done();
            }
         }

         rpcApi.handle('rpc://server/endpoint1', function(request, response) {
              console.log('rpcApi.handle(rpc://server/endpoint1) called');
              assert.equal('blah1 text', request.body);
              response('reply1');
         });

         rpcApi.handle('rpc://server/endpoint2', function(request, response) {
              console.log('rpcApi.handle(rpc://server/endpoint2) called');
              assert.equal('blah2 text', request.body);
              response('reply2');
         });

        var serverTransportChannel1 = bichannel.create("server1-transport");
        var rpcServerProtocol = rpcApi.protocolHandler().server();
        serverTransportChannel1.leftHandler(rpcServerProtocol);
        var muonMessage1 = messages.muonMessage('blah1 text', clientName, 'rpc://server/endpoint1', "response.sent");
        serverTransportChannel1.rightSend(muonMessage1);

        serverTransportChannel1.rightConnection().listen(function(msg) {
                assert.equal(msg.payload, 'reply1');
                calls.endpoint1++;
                callDone();
        });

        var serverTransportChannel2 = bichannel.create("server2-transport");
        var rpcServerProtocol = rpcApi.protocolHandler().server();
        serverTransportChannel2.leftHandler(rpcServerProtocol);
        var muonMessage2 = messages.muonMessage('blah2 text', clientName, 'rpc://server/endpoint2', "response.sent");
        serverTransportChannel2.rightSend(muonMessage2);

        serverTransportChannel2.rightConnection().listen(function(msg) {
                assert.equal(msg.payload, 'reply2');
                calls.endpoint2++;
                callDone();
        });

    });



});

