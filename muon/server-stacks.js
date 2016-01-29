var _ = require("underscore");
var bichannel = require('./infrastructure/channel');
var rpcProtocol = require('./protocol/rpc-protocol.js');

var ServerStacks = function (transport) {
    this.transport = transport;
};


var handlerMappings = {};

ServerStacks.prototype.openChannel = function(protocol) {

     var rpcProtocolHandler = rpcProtocol.newHandler();
      var clientChannel = channel.create("client-serverstacks");
       var serverStackChannel = bichannel.create("serverstacks");
     clientChannel.rightHandler(rpcProtocolHandler);
    serverStackChannel.leftHandler(rpcProtocolHandler);


    var serverResponseCallback = function(serverResposne) {
        clientChannel.leftConnection().send(serverResposne);
    };

    clientChannel.leftConnection().listen(function(event) {
        logger.debug('incoming event: ' + JSON.stringify(event));
        var endpoint = event.ENDPOINT;
        var handler = handlerMappings[endpoint];
        if (! handler) {
            event.status = '404';
            serverStackChannel.leftConnection().send(event);
        } else {
            handler(event, serverResponseCallback);
        }

    });
    return serverStackChannel.rightConnection();
};


ServerStacks.prototype.register = function(endpoint, callback) {
        logger.debug('registering handler endpoint: ' + endpoint);
        handlerMappings[endpoint] = callback;
};
module.exports = ServerStacks;

