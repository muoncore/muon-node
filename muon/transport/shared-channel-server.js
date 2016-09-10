
var _ = require("underscore")
var uuid = require("node-uuid")
var messages = require("../domain/messages")
var bichannel = require("../infrastructure/channel")
/**
 *
 */

module.exports.create = function(serverStacks) {

    var channel = bichannel.create("shared-channel")

    return channel.rightConnection();
}
