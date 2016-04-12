
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
        sendDownstream: function(event, accept, reject) {
            logger.debug('[*** CSP-CHANNEL:HANDLER ***] ' + name + ' sending event via handler downstream event.id=' + event.id);
            var result = outgoingFunction(event, accept, reject);
            logger.trace('[*** CSP-CHANNEL:HANDLER ***] ' + name + ' sending event via handler downstream event=' + JSON.stringify(event));
            return result;
        },
        sendUpstream: function(event, accept, reject) {
            logger.debug('[*** CSP-CHANNEL:HANDLER ***] ' + name + ' sending event via handler upstream event.id=' + event.id);
            var result = incomingFunction(event, accept, reject);
            logger.trace('[*** CSP-CHANNEL:HANDLER ***] ' + name + ' sending event via handler upstream event=' + JSON.stringify(event));
            return result;
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
