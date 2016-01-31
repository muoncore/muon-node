var url = require("url");
require('sexylog');
//var RpcProtocol = require('../protocol/rpc-protocol.js');
var channel = require('../infrastructure/channel.js');

var RSVP = require('rsvp');


var rpcProtocol = require('../protocol/rpc-protocol.js');


var AmqpDiscovery = require("../../muon/discovery/amqp/amqp-discovery.js");
var AmqpTransport = require("../../muon/transport/amqp/amqp09-transport");
var TransportClient = require("../../muon/transport/transport-client");
var ServerStacks = require("../../muon/server-stacks");


exports.create = function(serviceName, config, discoveryUrl, transportUrl) {

    var serverStacks = new ServerStacks();


    discovery = new AmqpDiscovery(discoveryUrl);
        discovery.advertiseLocalService({
            identifier:serviceName,
            tags:["node", serviceName],
            codecs:["application/json"]
        });

    var transport = new AmqpTransport(serviceName, serverStacks, transportUrl);
    var transportClient = new TransportClient(transport);

    var muonApi = {
        request: function(remoteServiceUrl, event, clientCallback) {



          var serviceRequest = url.parse(remoteServiceUrl, true);
            logger.trace('remote service: ', serviceRequest.hostname);
            var queue = "resource-listen." + serviceRequest.hostname;

            var transChannel = transportClient.openChannel();
             var clientChannel = channel.create("client-api");

             var rpcProtocolHandler = rpcProtocol.newHandler();
             //logger.trace('**** rpc proto: '+JSON.stringify(rpcProtocolHandler));

             clientChannel.rightHandler(rpcProtocolHandler);
             transChannel.leftHandler(rpcProtocolHandler);

            var promise = new RSVP.Promise(function(resolve, reject) {

                    var callback = function(event) {

                            if (! event || event.error) {
                                reject(event);
                            } else {
                                resolve(event);
                            }

                    };

                    clientChannel.leftConnection().listen(clientCallback);
                    clientChannel.leftConnection().send(event);
            });

            return promise;

        },
        handle: function(endpoint, callback) {
            serverStacks.register(endpoint, callback);
        }
    };
    return muonApi;
}

