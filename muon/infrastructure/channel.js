var csp = require("js-csp");
require('sexylog');

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

module.exports.create = function(name, validiator) {
    return new Channel(name, validiator);
}


function LeftConnection(name, inbound, outbound, validator) {
    name = name + '-left-connection';
    var self = this;
    var handler;
    var listener;
    var errCallback;
    var connectionObject = {
        onError: function(callback) {
            errCallback = callback;
        },
        throwErr: function(err) {
            if (! err instanceof Error) {
               err = new Error(err);
            }
            logger.warn('error message being thrown on channel "' + name + '". sending downstream.');
            csp.putAsync(outbound, err);
        },
        send: function(msg) {
            //logger.trace("[***** CSP-CHANNEL *****] " + name + ".listen() msg=" + typeof msg);
            var id = msg.id || "unknown";
            //logger.trace("[***** CSP-CHANNEL *****] " + name + ".send() msg.id='" + id + "'");
            //logger.trace("[***** CSP-CHANNEL *****] " + name + ".send() msg='" + JSON.stringify(msg));
            // validate message
            try {
               if (validator && ! (msg instanceof Error)) {
                    //logger.trace("[***** CSP-CHANNEL *****] " + name + ".send() validating msg");
                    validator(msg);
               }
            } catch(err) {
                logger.warn('invalid message received on channel "' + name + '" sending to error listener');
                if (errCallback) {
                    errCallback(err); // invalid send it back
                    return;
                } else {
                    throw new Error(err);
                }

            }
            var result = csp.putAsync(outbound, msg);
            //if (! result) throw new Error('csp channel closed');
        },
        listen: function(callback) {
            if (handler) throw new Error(name + ': cannot set LHS listener as handler already set');
            listener = callback;
            //logger.trace(name + " ChannelConnection.send() callback: " + callback);
            return csp.go(function*() {
                while(true) {
                    var msg = yield csp.take(inbound);
                    //logger.trace("[***** CSP-CHANNEL *****] " + name + ".listen() msg=" + JSON.stringify(msg));
                    var id = msg.id || "unknown";
                    // deal with errors
                    if (msg instanceof Error && errCallback) {
                        logger.warn('error message received on channel ' + name);
                        if (errCallback) errCallback(msg);
                        return;
                    }
                    if (callback) {
                        callback(msg);
                    } else {
                        return msg;
                    }
                }
            });
        },
        handler: function(h) {
            if (listener) throw new Error('cannot set handler as listener already set');
            if (handler) throw new Error('left handler already set on channel "' + name + '"');
            handler = h;
            handler.setDownstreamConnection(this);


            return csp.go(function*() {
                while(true) {
                    var msg = yield csp.take(inbound);
                     logger.trace("[***** CSP-CHANNEL *****] " + name + ".handler() msg recevied: " + JSON.stringify(msg));

                    var accept = function(result) {
                        handler.otherConnection(name).send(result);
                    };

                    var reject = function(result) {
                        handler.thisConnection(name).send(result);
                    };

                    handler.sendUpstream(msg, accept, reject);
                }
            });
        },
        name: function() {
            return name;
        }
    };
    //logger.trace('[***** CSP-CHANNEL *****] returning left connection '+ name);
    return connectionObject;
}






function RightConnection(name, inbound, outbound, validator) {
    name = name + '-right-connection';
    var self = this;
    var handler;
    var listener;
    var errCallback;
    //logger.trace('left validator: ', validator);
    var connectionObject = {
        onError: function(callback) {
            errCallback = callback;
        },
        throwErr: function(err) {
            if (! err instanceof Error) {
               err = new Error(err);
            }
            logger.warn('error message being thrown on channel "' + name + '". sending downstream.');
            csp.putAsync(outbound, err);
        },
        send: function(msg) {
            //logger.trace("[***** CSP-CHANNEL *****] " + name + ".send() msg=" + typeof msg);
            var id = msg.id || "unknown";
            //logger.trace("[***** CSP-CHANNEL *****] " + name + ".send() msg.id=" + id);
           // logger.debug("[***** CHANNEL *****] " + name + " ChannelConnection.send() listener: " + listener);
            try {
               if (validator && ! (msg instanceof Error)) {
                    //logger.trace("[***** CSP-CHANNEL *****] " + name + ".send() validating msg");
                    validator(msg);
               }
            } catch(err) {
               logger.warn('invalid message received on channel "' + name + '" sending to error listener');
                if (errCallback) {
                    errCallback(err); // invalid send it back
                    return;
                } else {
                    throw new Error(err);
                }
            }
            var result = csp.putAsync(outbound, msg);
            //if (! result) throw new Error('csp channel closed');
        },
        listen: function(callback) {
            if (handler) throw new Error(name + ': cannot set RHS listener as handler already set');
            listener = callback;
            //logger.trace(name + " ChannelConnection.send() callback: " + callback);
            return csp.go(function*() {
                while(true) {
                    var msg = yield csp.take(inbound);
                    var id = msg.id || "unknown";
                    //logger.trace("[***** CSP-CHANNEL *****] " + name + ".listen() msg=" + JSON.stringify(msg));
                    // deal with errors
                    if (msg instanceof Error && errCallback) {
                        logger.warn('error message received on channel ' + name);
                        errCallback(msg);
                        return;
                    }
                    //logger.trace("[***** CSP-CHANNEL *****] " + name + ".listen() msg.id=" + id);
                    if (callback) {
                        callback(msg);
                    } else {
                        return msg;
                    }
                }
            });
        },
        handler: function(h) {
            if (listener) throw new Error('cannot set handler as listener already set');
            if (handler) throw new Error('right handler already set on channel "' + name + '"');
            handler = h;
            handler.setUpstreamConnection(this);

            return csp.go(function*() {
                while(true) {
                    var msg = yield csp.take(inbound);
                    logger.trace("[***** CSP-CHANNEL *****] " + name + ".handler() msg recevied: " + JSON.stringify(msg));
                    var accept = function(result) {
                        handler.otherConnection(name).send(result);
                    };

                    var reject = function(result) {
                        handler.thisConnection(name).send(result);
                    };
                    handler.sendDownstream(msg, accept, reject);
                }
            });
        },
        name: function() {
            return name;
        }
    }
    //logger.trace('[***** CSP-CHANNEL *****] returning right connection ' + name);
    return connectionObject;
}


function Channel(name, validator) {
    var name = name + '-csp-channel' || "unnamed-csp-channel";
    var inbound = csp.chan();
    var outbound = csp.chan();
    var leftConnection = new LeftConnection(name, inbound, outbound, validator);
    var rightConnection = new RightConnection(name, outbound, inbound, validator);

    logger.trace('[***** CSP-CHANNEL *****] Created csp bi-channel with name="' + name + '"');
    return {
        leftEndpoint: function(object, ioFunctionName) {
            leftConnection.listen(function(args) {
                    var ioFunction = object[ioFunctionName];
                    var callback = function(reply) {
                        leftConnection.send(reply);
                    }
                    ioFunction(args, callback);
            });
        },
        rightEndpoint: function(object, ioFunctionName) {
               rightConnection.listen(function(args) {
                       var ioFunction = object[ioFunctionName];
                       var callback = function(reply) {
                           rightConnection.send(reply);
                       }
                       ioFunction(args, callback);
               });
           },
        leftHandler: function(handler) {
            leftConnection.handler(handler);
        },
        rightHandler: function(handler) {
            rightConnection.handler(handler);
        },
        leftConnection: function() {
            return leftConnection;
        },
        leftSend: function(msg) {
           leftConnection.send(msg);
         },
        rightConnection: function() {
            return rightConnection;
        },
        rightSend: function(msg) {
            rightConnection.send(msg);
        },
        close: function() {
            inbound.close();
            outbound.close();
        }
    }

}
