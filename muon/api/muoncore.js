//handle running in browser
logger = {
    info:function(message) {
        console.log(message);
    },
    error:function(message) {
        console.log(message);
    },
    debug:function(message) {
        console.log(message);
    },
    trace:function(message) {
        console.log(message);
    },
    warning:function(message) {
        console.log(message);
    }
};

var url = require("url");

//var RpcProtocol = require('../protocol/rpc-protocol.js');
var channel = require('../infrastructure/channel.js');
var uuid = require('node-uuid');

var RSVP = require('rsvp');


var rpcProtocol = require('../protocol/rpc-protocol.js');

var TransportClient = require("../../muon/transport/transport-client");
var ServerStacks = require("../../muon/server-stacks");


exports.create = function(serviceName, config) {

    var muon = this;

    var serverStacks = new ServerStacks();

    logger.info("Booting with transport ");
    console.dir(config.transport);
    logger.info("Booting with discovery ");
    console.dir(config.discovery);

    if (config.discovery.type == "browser") {
        logger.info("Using BROWSER")
        var BrowserDiscovery = require("../../muon/discovery/browser/browser-discovery");

        discovery = new BrowserDiscovery(config.discovery.url);
    } else {
        require('sexylog');
        logger.info("Using AMQP");
        var AmqpDiscovery = require("../../muon/discovery/amqp/amqp-discovery");

        discovery = new AmqpDiscovery(config.discovery.url);
        discovery.advertiseLocalService({
            identifier:serviceName,
            tags:["node", serviceName],
            codecs:["application/json"]
        });
    }

    if (config.transport.type == "browser") {
        var BrowserTransport = require("../../muon/transport/browser/browser-transport");
        transport = new BrowserTransport(serviceName, serverStacks, config.transport.url);
    } else {
        var AmqpTransport = require("../../muon/transport/amqp/amqp09-transport");
        transport = new AmqpTransport(serviceName, serverStacks, config.transport.url);
    }

    var transportClient = new TransportClient(transport);

    var muonApi = {
        getDiscovery: function() { return muon.discovery },
        getTransportClient: function() { return transportClient },
        shutdown: function() {
            logger.info("Shutting down!!");
        },
        request: function(remoteServiceUrl, payload, clientCallback) {

            var serviceRequest = url.parse(remoteServiceUrl, true);
            var eventid = uuid.v4();
             var event = {
                        id: eventid,
                        headers: {
                            eventType: "RequestMade",
                            id: eventid,
                            targetService: serviceRequest.hostname,
                            sourceService: serviceName,
                            protocol: "request",
                            url: remoteServiceUrl,
                            "Content-Type": "application/json",
                            sourceAvailableContentTypes: ["application/json"],
                            channelOperation: "NORMAL"
                        },
                        payload: {
                            message: payload
                        }
                    };


         // var path = remoteServiceUrl.split('/')[3];

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

