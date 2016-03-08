
var url = require("url");
//var RpcProtocol = require('../protocol/rpc-protocol.js');
var channel = require('../infrastructure/channel.js');
var uuid = require('node-uuid');
var RSVP = require('rsvp');
require('sexylog');
var rpcProtocol = require('../protocol/rpc-protocol');
var rpcServerProtocol = require('../protocol/rpc-protocol');
var events = require('../domain/events.js');
var MuonBuilder = require("../infrastructure/builder");



exports.create = function(serviceName, configuration) {

    configuration.serviceName = serviceName;

    var infrastructure = new MuonBuilder(configuration);

    /*



    */

    var muonApi = {
        getDiscovery: function() { return infrastructure.discovery },
        getTransportClient: function() { return infrastructure.transportClient },
        shutdown: function() {
            logger.info("Shutting down!!");
        },
        request: function(remoteServiceUrl, payload, clientCallback) {

           var event = events.rpcEvent(payload, serviceName, remoteServiceUrl, 'application/json');

              var transChannel = infrastructure.transport.openChannel(serviceName, 'test-rpc-protocol-(totally made up, not yet implemented)');
           //var transChannel = infrastructure.transportClient.openChannel();
           var clientChannel = channel.create("client-api");
           var rpcProtocolHandler = rpcProtocol.newHandler();
           clientChannel.rightHandler(rpcProtocolHandler);
           console.dir(transChannel);
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

