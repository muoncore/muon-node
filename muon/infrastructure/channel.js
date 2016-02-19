var csp = require("js-csp");

/**
 * Muon-node bi-directional channel
 *
 * Bi directional channel with two endpoints (connections) named right & left
 * Each endpoint has an inbound and bound unidrectional channel to send arbitrary messages along to each other
 *
 * var bichannel = require('./bi-channel.js');
 * var channel = bichannel.create("cleint-api");
 * client1(channel.left());
 * client2(channel.right());
 *
 */

module.exports.create = function(name) {
    return new Channel(name);
}


function LeftConnection(name, inbound, outbound) {
    name = name + '-left-connection';
    var handler;
    var listener;
    var connectionObject = {
        send: function(msg) {
            var id = "unknown";
            if (msg.headers !== undefined) {
                id = msg.headers.id;
            }
            logger.trace("[***** CHANNEL *****] " + name + " ChannelConnection.send() event.id='" + id + "'");
            csp.putAsync(outbound, msg);
        },
        listen: function(callback) {
            if (handler) throw new Error(name + ': cannot set listener as handler already set');
            listener = callback;
            return csp.go(function*() {
                while(true) {
                    var value = yield csp.take(inbound);
                    var id = "unknown";
                    if (value.headers !== undefined) {
                        id = value.headers.id;
                    }
                    logger.trace("[***** CHANNEL *****] " + name + " ChannelConnection.listen() event.id=" + id);
                    if (callback) {
                        callback(value);
                    } else {
                        return value;
                    }
                }
            });
        },
        handler: function(h) {
            if (listener) throw new Error('cannot set handler as listener already set');
            handler = h;
            return csp.go(function*() {
                while(true) {
                    var value = yield csp.take(inbound);
                    var id = "unknown";
                    if (value.headers !== undefined) {
                        id = value.headers.id;
                    }
                    logger.trace("[***** CHANNEL *****] " + name + "ChannelConnection.handler() event.id=" + id);
                    if (handler) {
                        try {
                            var result = handler.sendUpstream(value);
                            logger.info('handler result.id=' + id);
                            handler.otherConnection(name).send(result);
                        } catch(err) {
                            logger.error(name + ': ' + err);
                            var reply = {status: 'error'};
                            handler.otherConnection(name).send(reply);
                        }
                    } else {
                        throw new Error('handler not set');
                    }

                }
            });
        },
        name: function() {
            return name;
        }
    };
    logger.trace('[***** CHANNEL *****] returning left connection '+ name);
    return connectionObject;
}


function RightConnection(name, inbound, outbound) {
    name = name + '-right-connection'
    var handler;
    var listener;
    var connectionObject = {
        send: function(msg) {
            var id = "unknown";
            if (msg.headers !== undefined) {
                id = msg.headers.id;
            }
            logger.debug("[***** CHANNEL *****] " + name + " ChannelConnection.send() event.id='" + id + "'");
           // logger.debug("[***** CHANNEL *****] " + name + " ChannelConnection.send() listener: " + listener);
            csp.putAsync(outbound, msg);
        },
        listen: function(callback) {
            if (handler) throw new Error(name + ': cannot set listener as handler already set');
            listener = callback;
            //logger.trace(name + " ChannelConnection.send() callback: " + callback);
            return csp.go(function*() {
                while(true) {
                    var value = yield csp.take(inbound);
                    var id = "unknown";
                    if (value.headers !== undefined) {
                        id = value.headers.id;
                    }
                     logger.debug("[***** CHANNEL *****] " + name + " ChannelConnection.listen() event.id=" + id);
                    if (callback) {
                        callback(value);
                    } else {
                        return value;
                    }

                }
            });
        },
        handler: function(h) {
            if (listener) throw new Error('cannot set handler as listener already set');
            handler = h;
            return csp.go(function*() {
                while(true) {
                    var value = yield csp.take(inbound);
                    var id = "unknown";
                    if (value.headers !== undefined) {
                        id = value.headers.id;
                    }
                     logger.debug("[***** CHANNEL *****] " + name + " ChannelConnection.handler() event.id=" + id);
                    if (handler) {
                        try {
                            var result = handler.sendDownstream(value);
                            //logger.trace('handler result=' + JSON.stringify(result));
                            handler.otherConnection(name).send(result);
                        } catch(err) {
                            logger.error(name + ': ' + err);
                            var reply = {status: 'error'};
                            logger.info('[***** CHANNEL *****]  error: returning message back upstream');
                            csp.putAsync(outbound, reply);
                        }

                    } else {
                        throw new Error('handler not set');
                    }

                }
            });
        },
        name: function() {
            return name;
        }
    }
    logger.trace('[***** CHANNEL *****] returning right connection '+ name);
    return connectionObject;
}


function Channel(name) {
    //logger.trace('creating... Channel(' + name + ')');
    var name = name + '-channel' || "default-channel";
    var inbound = csp.chan();
    var outbound = csp.chan();

    var leftHandler;
    var rightHandler;

    var leftConnection = new LeftConnection(name, inbound, outbound);
    var rightConnection = new RightConnection(name, outbound, inbound);

    logger.trace('[***** CHANNEL *****] Created! Channel(' + name + ')');
    return {
        leftHandler: function(handler) {
            if (leftHandler) throw new Error('left handler already set on channel "' + name + '"');
            leftConnection.handler(handler);
            leftHandler = handler;
            handler.downstreamConnection(leftConnection);
        },
        rightHandler: function(handler) {
            if (leftHandler) throw new Error('right handler already set on channel "' + name + '"');
            rightConnection.handler(handler);
            handler.upstreamConnection(rightConnection);
            rightHandler = handler;
        },
        leftConnection: function() {
            return leftConnection;
        },
        rightConnection: function() {
            return rightConnection;
        },
        close: function() {
            inbound.close();
            outbound.close();
        }
    }

}







