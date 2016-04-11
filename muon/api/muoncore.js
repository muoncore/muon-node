
var url = require("url");
//var RpcProtocol = require('../protocol/rpc-protocol.js');
var channel = require('../infrastructure/channel.js');
var uuid = require('node-uuid');
var RSVP = require('rsvp');
require('sexylog');
var rpcProtocol = require('../protocol/rpc-protocol');
var rpcServerProtocol = require('../protocol/rpc-protocol');
var messages = require('../domain/messages.js');
var ServerStacks = require("../../muon/api/server-stacks");
var amqpTransport = require('../../muon/transport/rabbit/transport.js');
var builder = require("../infrastructure/builder");

exports.create = function(serviceName, url) {

    var config = builder.config(serviceName, url);
    var infrastructure = new builder.build(config);

    var muonApi = {
        discovery: function() { return infrastructure.discovery },
        shutdown: function() {
            logger.info("Shutting down!! //todo code the logic in");
        },
        request: function(remoteServiceUrl, payload, clientCallback) {

           var event = messages.muonMessage(payload, serviceName, remoteServiceUrl);

           var transChannel = infrastructure.transport.openChannel(event.target_service, 'request');
           var clientChannel = channel.create("client-api");
           var rpcProtocolHandler = rpcProtocol.newHandler();
           clientChannel.rightHandler(rpcProtocolHandler);
           transChannel.handler(rpcProtocolHandler);

           var promise = new RSVP.Promise(function(resolve, reject) {
                var callback = function(event) {
                        if (! event || event.error) {
                            logger.warn('client-api promise failed check! calling promise.reject()');
                            reject(event);
                        } else {
                            logger.trace('promise calling promise.resolve() event.id=' + event.id);
                            resolve(event);
                        }
                };
                if (clientCallback) callback = clientCallback;
                clientChannel.leftConnection().listen(callback);
                clientChannel.leftConnection().send(event);
            });

            return promise;

        },
        handle: function(endpoint, callback) {
            infrastructure.serverStacks.register(endpoint, callback);
        }
    };
    return muonApi;
}

