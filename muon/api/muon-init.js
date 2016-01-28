var url = require("url");
require('sexylog');
//var RpcProtocol = require('../protocol/rpc-protocol.js');
var channel = require('../infrastructure/channel.js');
var handler = require('../infrastructure/handler.js');


var AmqpDiscovery = require("../../muon/discovery/amqp/amqp-discovery.js");
var AmqpTransport = require("../../muon/transport/amqp/amqp09-transport");
var TransportClient = require("../../muon/transport/transport-client");

var discovery = new AmqpDiscovery("amqp://muon:microservices@localhost");
discovery.advertiseLocalService({
    identifier:"awesome",
    tags:["node", "awesome"],
    codecs:["application/json"]
});

var transport = new AmqpTransport("amqp://muon:microservices@localhost");

var transportClient = new TransportClient(transport);

exports.create = function(config, discovery, transport) {


    var muon = {
        request: function(remoteServiceUrl, event, clientCallback) {

                //pseudo code
                var serviceRequest = url.parse(remoteServiceUrl, true);
                logger.trace('remote service: ', serviceRequest.hostname);
                var queue = "resource-listen." + serviceRequest.hostname;

                var transChannel = transportClient.openChannel();
                 var clientChannel = channel.create("client-api-channel");
                 var rpcProtocolHandler = handler.create();
                 rpcProtocolHandler.outgoing(function(event) {
                        logger.info("rpc protocol outgoing event id=" + event.id);
                        return event;
                 });
                 rpcProtocolHandler.incoming(function(event) {
                        logger.info("rpc protocol incoming event id=" + event.id);
                        return event;
                 });


                 clientChannel.rightHandler(rpcProtocolHandler);
                 transChannel.leftHandler(rpcProtocolHandler);

                 clientChannel.leftConnection().listen(clientCallback);

                clientChannel.leftConnection().send(event); // kick off muon client/server comms

        },
        handle: function() {

        }
    };
    return muon;
}