var _ = require("underscore");
var bichannel = require('../infrastructure/channel');
var rpcProtocol = require('../protocol/rpc-protocol.js');
var events = require('../domain/events.js');


var ServerStacks = function (transport) {
    this.transport = transport;
};


var handlerMappings = {};

ServerStacks.prototype.openChannel = function(protocol) {

     logger.trace("[*** API ***] creating muon server stacks channels...");
     var rpcProtocolHandler = rpcProtocol.newHandler();
      var clientChannel = bichannel.create("serverapi");
       var serverStackChannel = bichannel.create("serverstacks");
     clientChannel.rightHandler(rpcProtocolHandler);
    serverStackChannel.leftHandler(rpcProtocolHandler);




    clientChannel.leftConnection().listen(function(event) {

      var serverResponseCallback = function(serverResposne) {
/*
             var eventid = uuid.v4();
              var respondEvent = {
                         id: eventid,
                         headers: {
                             eventType: "RequestServerReply",
                             id: eventid,
                             oringinalEventId: event.id,
                             targetService: event.headers.sourceService,
                             sourceService: event.headers.targetService,
                             protocol: "request",
                             url: event.headers.url,
                             "Content-Type": "application/json",
                             sourceAvailableContentTypes: ["application/json"],
                             channelOperation: "NORMAL",

                         },
                         payload: {
                             message: serverResposne
                         }
                     };
                     */

              var respondEvent = events.rpcEvent(serverResposne, event.headers.sourceService, event.headers.url, 'application/json');
             clientChannel.leftConnection().send(respondEvent);
         };



        logger.debug('[*** API ***] incoming event: ' + JSON.stringify(event));
        var endpoint = event.headers.url;
        var handler = handlerMappings[endpoint];
        if (! handler) {

               logger.warn('[*** API ***] NO HANDLER FOUND FOR ENDPOINT: "' + endpoint + '" RETURN 404! event.id=' + event.id);
               //TODO return message with error
            serverStackChannel.leftConnection().send(event);
        } else {
            logger.info('[*** API ***] Handler found for endpoint "'+ event.headers.url + '" event.id=' + event.headers.id);
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

