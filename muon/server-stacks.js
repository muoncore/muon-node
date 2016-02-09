var _ = require("underscore");
var bichannel = require('./infrastructure/channel');
var rpcProtocol = require('./protocol/rpc-protocol.js');

var ServerStacks = function (transport) {
    this.transport = transport;
};


var handlerMappings = {};

ServerStacks.prototype.openChannel = function(protocol) {

     logger.trace("creating muon server stacks channels...");
     var rpcProtocolHandler = rpcProtocol.newHandler();
      var clientChannel = bichannel.create("serverapi");
       var serverStackChannel = bichannel.create("serverstacks");
     clientChannel.rightHandler(rpcProtocolHandler);
    serverStackChannel.leftHandler(rpcProtocolHandler);


    var serverResponseCallback = function(serverResposne) {
        clientChannel.leftConnection().send(serverResposne);
    };

    clientChannel.leftConnection().listen(function(event) {
        logger.debug('incoming event: ' + JSON.stringify(event));
        var endpoint = event.headers.url;
        var handler = handlerMappings[endpoint];
        if (! handler) {
               logger.warn('NO HANDLER FOUND FOR ENDPOINT: "' + endpoint + '" RETURN 404! event.id' + event.headers.id);
               logger.warn('handlerMappings: ', handlerMappings);
            event.status = '404';
            var handler = handlerMappings['/muon/internal/transport'];
            handler(event);
            serverStackChannel.leftConnection().send(event);
        } else {
            logger.info('Handler found for endpoint "'+ event.headers.url + '" event.id=' + event.headers.id);
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

