var _ = require("underscore");
var bichannel = require('../infrastructure/channel');

var TransportClient = function (transport) {
    this.transport = transport;
};

TransportClient.prototype.openChannel = function() {

    var trClient = this;
    var channelConnection = {
        channel: bichannel.create("transport-client"),
        internalChannels:{}
    };

    channelConnection.channel.rightConnection().listen(function(msg) {

        if (msg == null || msg == "poison") {
            logger.debug("Shutting down full channel, including all child channels.");

            //todo, iterate all the client channels, send null.

            Object.keys(channelConnection.internalChannels).forEach(function(key) {
                var val = channelConnection.internalChannels[key];
                val.send("poison");
            });

            return;
        }
        //console.dir(msg);
        //lookup the service/ proto combo in internal channels
        var channelKey = msg.headers.targetService + "-" + msg.headers.protocol;
        var internalChannel = channelConnection.internalChannels[channelKey];

        if (internalChannel == undefined) {
            logger.debug("Establishing new channel to " + channelKey);
            var newChannel = trClient.transport.openChannel(msg.headers.targetService, msg.headers.protocol);
            channelConnection.internalChannels[channelKey] = newChannel;
            internalChannel = newChannel;
            internalChannel.listen(function(msg) {
                channelConnection.channel.rightConnection().send(msg);
            });
        }
        internalChannel.send(msg);
    });

    return channelConnection.channel;
};

module.exports = TransportClient;

