var _ = require("underscore");
var bichannel = require('../infrastructure/channel');
var rpcProtocol = require('../protocol/rpc-protocol.js');
var messages = require('../domain/messages.js');


var ServerStacks = function (transport) {
    this.transport = transport;
};


var handlerMappings = {};

ServerStacks.prototype.openChannel = function(protocol) {

     logger.info("[*** API ***] opening muon server stacks channel...");
     var rpcProtocolHandler = rpcProtocol.newHandler();
      var clientChannel = bichannel.create("serverapi");
       var serverStackChannel = bichannel.create("serverstacks");
     clientChannel.rightHandler(rpcProtocolHandler);
    serverStackChannel.leftHandler(rpcProtocolHandler);




    clientChannel.leftConnection().listen(function(event) {

      var serverResponseCallback = function(serverResposne) {
              var respondMessage = messages.rpcMessage(serverResposne, event.origin_service, event.url);
             clientChannel.leftConnection().send(respondMessage);
         };



        logger.debug('[*** API ***] incoming event: ' + JSON.stringify(event));
        var endpoint = event.url;
        var handler = handlerMappings[endpoint];
        if (! handler) {

               logger.warn('[*** API ***] NO HANDLER FOUND FOR ENDPOINT: "' + endpoint + '" RETURN 404! event.id=' + event.id);
               //TODO return message with error
            serverStackChannel.leftConnection().send(event);
        } else {
            logger.info('[*** API ***] Handler found for endpoint "'+ event.url + '" event.id=' + event.id);
            handler(event, serverResponseCallback);
        }

    });
    return serverStackChannel.rightConnection();
};


ServerStacks.prototype.register = function(endpoint, callback) {
        logger.debug('[*** API ***] registering handler endpoint: ' + endpoint);
        handlerMappings[endpoint] = callback;
};
module.exports = ServerStacks;

