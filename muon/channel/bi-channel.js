
var csp = require("js-csp");
require('sexylog');

/**
 * Muon-node bi-directional channel
 *
 * Bi directional channel with two endpoints (connections) named right & left
 * Each endpoint has an inbound and bound unidrectional channel to send arbitrary messages along to each other
 *
 * var bichannel = require('./bi-channel.js');
 * var channel = bichannel.create("test-channel");
 * client1(channel.left());
 * client2(channel.right());
 *
 */

module.exports.create = function(name) {
    return new Channel(name);
}


function ChannelConnection(name, inbound, outbound) {

    return {
        send: function(msg) {
            logger.debug(name + " ChannelConnection.send() msg='" + msg + "'");
            csp.putAsync(outbound, msg);
        },
        listen: function(callback) {
            return csp.go(function*() {
                while(true) {
                    var value = yield csp.take(inbound);
                     logger.debug(name + " ChannelConnection.listen() value=" + value);
                    if (callback) {
                        callback(value);
                    } else {
                        return value;
                    }

                }
            });
        },
        name: function() {
            name
        }
    }
}


function Channel(name) {
    var name = name || "default-channel";
    var inbound = csp.chan();
    var outbound = csp.chan();

    var leftConnection = new ChannelConnection("left-" + name, inbound, outbound);
    var rightConnection = ChannelConnection("right-" + name, outbound, inbound);

    return {
        left: function() {
            return leftConnection
        },
        right: function() {
            return rightConnection
        },
        close: function() {
            inbound.close();
            outbound.close();
        }
    }

}







