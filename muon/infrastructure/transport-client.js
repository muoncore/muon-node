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

module.exports.create = function(transport) {

    var transportChannels= {}
    var virtualChannels = {}

    /*
     * TODO, handle shutdown message from the transport.
     * shutdown message from the virtual channel, close on the other side and remove from this list
     *
     * logically tie virtual to transport channels. probably in data sturcture?
     * need to track usage of transport channels. if they are not used for a while (ie, no active virtual channels), shut them down.
     */


    var transportApi = {
        openChannel: function (remoteServiceName, protocolName) {
            //look up channel. if not found, create
            var transportChannel = null;
            if (transportChannel == null) {
                transportChannel = transport.openChannel(remoteServiceName, "shared-channel")
                //listen left, look up
                transportChannel.left().listen(function(msg) {
                    //unwrap SharedChannelMessage

                    // look up virtual channel

                    //send wrapped message down the channel
                })
            }

            //generate the client side multiplex
            var channelConnection = null; //TODO, bichannel.X
            channelConnection.right.listen(function(message) {
                var sharedChannelMessage = null //TODO, wrap message into this.

                transportChannel.left().send(sharedChannelMessage) //TODO, correct API?
            })

            return channelConnection;
        },
        onError: function (cb) {
            return transport.onError(cb)
        },
        shutdown: function() {
            return transport.shutdown()
        }
    }
}
