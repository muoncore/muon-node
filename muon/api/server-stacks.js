var _ = require("underscore");
var bichannel = require('../infrastructure/channel');
var rpcProtocol = require('../protocol/rpc-protocol.js');
var messages = require('../domain/messages.js');


var ServerStacks = function (serverName) {
   this.serverName = serverName;
};


var handlerMappings = {};

ServerStacks.prototype.openChannel = function(protocol) {

     logger.info("[*** API ***] opening muon server stacks channel...");
      var clientChannel = bichannel.create("serverapi");
       var serverStackChannel = bichannel.create("serverstacks");
       var rpcProtocolHandler = rpcProtocol.newHandler(this.serverName);
     clientChannel.rightHandler(rpcProtocolHandler);
    serverStackChannel.leftHandler(rpcProtocolHandler);


    clientChannel.leftConnection().listen(function(incomingMsg) {

      var serverResponseCallback = function(serverResposne) {
             clientChannel.leftConnection().send(serverResposne);
         };

        logger.debug('[*** API ***] incoming message: ' + JSON.stringify(incomingMsg));
        var endpoint = incomingMsg.requestUrl;
        var handler = handlerMappings[endpoint];
        if (! handler) {
            logger.warn('[*** API ***] NO HANDLER FOUND FOR ENDPOINT: "' + endpoint + '" RETURN 404! event.id=' + incomingMsg.id);
            var return404msg = messages.rpcServer404(incomingMsg);
            serverStackChannel.leftConnection().send(return404msg);
        } else {
            logger.info('[*** API ***] Handler found for endpoint "'+ incomingMsg.requestUrl + '" event.id=' + incomingMsg.id);
            handler(incomingMsg, serverResponseCallback);
        }

    });
    return serverStackChannel.rightConnection();
};


ServerStacks.prototype.register = function(endpoint, callback) {
        logger.debug('[*** API ***] registering handler endpoint: ' + endpoint);
        handlerMappings[endpoint] = callback;
};
module.exports = ServerStacks;

