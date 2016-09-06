
var _ = require("underscore")
var uuid = require("node-uuid")
var messages = require("../domain/messages")
var bichannel = require("./channel")
/**
 * Implements the client side of transport socket sharing.
 *
 * This will instantiate a single transport channel per remote service.
 *
 * It then provides multiple logical channels on the API side.
 *
 * It multiplexes left channel messages over the single right transport channel. This requires a server side multiplex
 * at the transport/ ServerStack boundary
 */

module.exports.create = function(transport, infrastructure) {

    /*
     * "channelId (uuid)": {
     *   "virtualChannels": [ 
     *      {
     *        channel_id
     *        channel
     *      }
     *   ]
     * }
     */
    var transportChannels= {}
    var virtualChannels = {}
    /*
     * TODO, handle shutdown message from the transport.
     * shutdown message from the virtual channel, close on the other side and remove from this list
     *
     * logically tie virtual to transport channels. probably in data sturcture?
     * need to track usage of transport channels. if they are not used for a while (ie, no active virtual channels), shut them down.
     */


    function virtualChannel(remoteServiceName, protocolName) {

        logger.debug("Opening virtual channel to " + remoteServiceName)
        
        var virtualChannel = {
            channel_id:uuid.v4().toString(),
            channel: null
        }
        virtualChannels[virtualChannel.channel_id] = virtualChannel
        
        var transportChannel = transportChannels[remoteServiceName]
        if (transportChannel == null) {
            logger.debug("Opening transport channel to " + remoteServiceName)
            transportChannel = transport.openChannel(remoteServiceName, "shared-channel")
            transportChannels[remoteServiceName] = transportChannel
            transportChannel.listen(function(msg) {
                logger.debug("Received message from transport " + JSON.stringify(msg))
                var sharedChannelMessage = messages.decode(msg.payload)
                var virtualChannel = virtualChannels[sharedChannelMessage.channelId]
                var wrappedMuonMsg = sharedChannelMessage.message
                virtualChannel.channel.rightConnection().send(wrappedMuonMsg);
            })
        }

        logger.debug("Creating bichannel for virtual channel connection")
        //generate the client side multiplexer
        virtualChannel.channel = bichannel.create("virtual-channel-" + remoteServiceName)
        virtualChannel.channel.rightConnection().listen(function(message) {
            logger.debug("Sending shared-channel message " + JSON.stringify(message))
            var sharedChannelMessage = {
                channelId: virtualChannel.channel_id,
                message: message
            }

            //TODO, re-encode into a muon message for the transport to send.

            var muonMsg = messages.muonMessage(sharedChannelMessage, message.origin_service, remoteServiceName, "shared-channel", "message")

            transportChannel.send(muonMsg)
        })

        return virtualChannel.channel.leftConnection();
    }

    function transportChannel(remoteServiceName, protocolName) {
        return transport.openChannel(remoteServiceName, protocolName)
    }

    var transportApi = {
        openChannel: function (remoteServiceName, protocolName) {
            logger.debug("Open transclient channel " + remoteServiceName)
            // var remoteService = infrastructure.discovery.find(remoteServiceName)
            var supportsSharedChannels = true
            // if (remoteService && _.contains(remoteService.capabilities, "shared-channel")) {
            //     logger.debug("Opening shared-channel connection to " + remoteServiceName)
            //     supportsSharedChannels = true
            // }

            try {
                if (supportsSharedChannels) {
                    logger.debug("Remote supports shared-channel, generating a virtual channel")
                    return virtualChannel(remoteServiceName, protocolName)
                } else {
                    logger.debug("No rmeote support for shared-channel, returning transport channel directly")
                    return transportChannel(remoteServiceName, protocolName)
                }
            } catch (e) {
                console.log("ERROR DETECTED")
                logger.error("WARNING!", e)
            }
        },
        onError: function (cb) {
            return transport.onError(cb)
        },
        shutdown: function() {
            return transport.shutdown()
        }
    }

    return transportApi;
}
