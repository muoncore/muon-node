
var url = require("url");
//var RpcProtocol = require('../protocol/rpc-protocol.js');
var channel = require('../infrastructure/channel.js');
var uuid = require('node-uuid');
var RSVP = require('rsvp');
require('sexylog');
var rpcProtocol = require('../protocol/rpc-protocol.js');
var events = require('../domain/events.js');

var TransportClient = require("../../muon/transport/transport-client");
var ServerStacks = require("../../muon/api/server-stacks");
var BrowserTransport = require("../../muon/transport/browser/browser-transport");
var BrowserDiscovery = require("../../muon/discovery/browser/browser-discovery");
var AmqpDiscovery = require("../../muon/discovery/amqp/amqp-discovery");
 var AmqpTransport = require("../../muon/transport/amqp/amqp09-transport");


exports.create = function(serviceName, config) {

    var serverStacks = new ServerStacks();

    if (config.type == "browser") {
        logger.info("Using BROWSER")
        discovery = new BrowserDiscovery(config.discovery.url);
         transport = new BrowserTransport(serviceName, serverStacks, config.transport.url);
    } else {
        logger.info("Using AMQP");
        discovery = new AmqpDiscovery(config.discovery.url);
        transport = new AmqpTransport(serviceName, serverStacks.openChannel(), config.transport.url);
        discovery.advertiseLocalService({
            identifier:serviceName,
            tags:["node", serviceName],
            codecs:["application/json"]
        });
    }


    var transportClient = new TransportClient(transport);

    var muonApi = {
        getTransportClient: function() {
            return transportClient
        },
        shutdown: function() {
            logger.info("Shutting down!!");
        },
        request: function(remoteServiceUrl, payload, clientCallback) {

           var event = events.rpcEvent(payload, serviceName, remoteServiceUrl, 'application/json');
           var transChannel = transportClient.openChannel();
           var clientChannel = channel.create("client-api");
           var rpcProtocolHandler = rpcProtocol.newHandler();
           clientChannel.rightHandler(rpcProtocolHandler);
           transChannel.leftHandler(rpcProtocolHandler);

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
            serverStacks.register(endpoint, callback);
        }
    };
    return muonApi;
}

