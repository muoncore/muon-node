
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

        var virtualChannel = {
            channel_id:uuid.v4().toString(),
            channel: null
        }
        virtualChannels[virtualChannel.channel_id] = virtualChannel
        
        var transportChannel = transportChannels[remoteServiceName]
        if (transportChannel == null) {
            transportChannel = transport.openChannel(remoteServiceName, "shared-channel")
            transportChannels[remoteServiceName] = transportChannel
            transportChannel.left().listen(function(msg) {
                var sharedChannelMessage = messages.decode(msg.payload)
                var virtualChannel = virtualChannels[sharedChannelMessage.channelId]
                var wrappedMuonMsg = messages.decode(sharedChannelMessage.message)
                virtualChannel.channel.rightConnection().send(wrappedMuonMsg);
            })
        }

        //generate the client side multiplexer
        virtualChannel.channel = bichannel.create("virtual-channel-" + remoteServiceName)
        virtualChannel.channel.rightConnection().listen(function(message) {
            var sharedChannelMessage = {
                channelId: virtualChannel.channel_id,
                message: messages.encode(message)
            }

            transportChannel.leftConnection().send(sharedChannelMessage)
        })

        return virtualChannel.channel.leftConnection();
    }

    function transportChannel(remoteServiceName, protocolName) {
        return transport.openChannel(remoteServiceName, protocolName)
    }

    var transportApi = {
        openChannel: function (remoteServiceName, protocolName) {

            var remoteService = infrastructure.discovery.find(remoteServiceName)
            var supportsSharedChannels = false
            if (remoteService && _.contains(remoteService.capabilities, "shared-channel")) {
                logger.debug("Opening shared-channel connection to " + remoteServiceName)
                supportsSharedChannels = true
            }

            if (supportsSharedChannels) {
                return virtualChannel(remoteServiceName, protocolName)
            } else {
                return transportChannel(remoteServiceName, protocolName)
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
