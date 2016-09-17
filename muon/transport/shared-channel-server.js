
var _ = require("underscore")
var uuid = require("node-uuid")
var messages = require("../domain/messages")
var bichannel = require("../infrastructure/channel")
/**
 *
 */

module.exports.create = function(serverStacks) {

    var channel = bichannel.create("shared-channel")

    channel.leftConnection().listen(function(message) {
        if (message.protocol == "shared-channel") {
            
            var sharedChannelMessage = messages.decode(message.payload)
            var sharedChannelId = sharedChannelMessage.channelId
            var protocolMessage = sharedChannelMessage.message
            console.log("SHARED CHANNEL RECEIVE " + JSON.stringify(wrapped))
        }
    })
    
    return channel.rightConnection();
}
