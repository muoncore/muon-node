
var callbacks = {};

module.exports.create = function(n) {

    if (! n) n = 'default';
    var name = n + '-handler';

    var outgoingFunction;
    var incomingFunction;

    var upstreamConnection;
    var downstreamConnection;



    return {
        outgoing: function(f) {
            outgoingFunction = f;
        },
        incoming: function(f) {
            incomingFunction = f;
        },
        register(callback, key) {
            callbacks[key] = callback;
        },
        sendDownstream: function(msg, accept, reject) {
            logger.debug('[*** CSP-CHANNEL:HANDLER ***] ' + name + ' sending message via handler downstream msg: ' +  JSON.stringify(msg));
            var route = createRoute(upstreamConnection, incomingFunction);
            outgoingFunction(msg, accept, reject, route);
        },
        sendUpstream: function(msg, accept, reject) {
            logger.debug('[*** CSP-CHANNEL:HANDLER ***] ' + name + ' sending message via handler upstream event.id=' + JSON.stringify(msg));
            var route = createRoute(downstreamConnection, outgoingFunction);
            incomingFunction(msg, accept, reject, route);
        },
        getUpstreamConnection: function() {
            return upstreamConnection;
        },
        getDownstreamConnection: function() {
            return downstreamConnection;
        },
        upstreamConnection: function(c) {
            upstreamConnection = c;
        },
        downstreamConnection: function(c) {
            downstreamConnection = c;
        },
        otherConnection(conn) {
            if (conn === upstreamConnection.name()) {
                logger.trace('[*** CSP-CHANNEL:HANDLER ***]  ' + name + ' other connection is downstream: ' + downstreamConnection.name());
                return downstreamConnection;
            } else {
                logger.trace('[*** CSP-CHANNEL:HANDLER ***] ' + name + ' other connection is upstream: ' + upstreamConnection.name());
                return upstreamConnection;
            }
        },
        thisConnection(conn) {
            if (conn === upstreamConnection.name()) {
                logger.trace('[*** CSP-CHANNEL:HANDLER ***]  ' + name + ' other connection is downstream: ' + downstreamConnection.name());
                return upstreamConnection;
            } else {
                logger.trace('[*** CSP-CHANNEL:HANDLER ***] ' + name + ' other connection is upstream: ' + upstreamConnection.name());
                return downstreamConnection;
            }
        }
    };

}


function createRoute(otherConnection, handlerFunction) {


    var route = function(message, key) {
        var callbackHandler = callbacks[key];

        if (! callbackHandler) throw new Error('unable to find callback handler for key: ' + key);

        var tempCallback = function(response) {
            logger.trace('[*** CSP-CHANNEL:HANDLER ***] callback handler returned response for key: ' + key);
            var accept = function(result) {
                otherConnection.send(result);
            };

            var reject = function(result) {
                callbackHandler({}, error);
            };
            logger.trace('[*** CSP-CHANNEL:HANDLER ***] calling onward function for key: ' + key);
            handlerFunction(response, accept, reject);
        }
        logger.trace('[*** CSP-CHANNEL:HANDLER ***]  executing routed callback handler for key: ' + key);
        callbackHandler(message, tempCallback);
    };

    return route;

}