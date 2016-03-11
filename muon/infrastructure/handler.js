
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
        sendDownstream: function(event) {
            logger.debug('[*** CSP-CHANNEL ***] ' + name + ' sending event via handler downstream event.id=' + event.id);
            var result = outgoingFunction(event);
            logger.trace('[*** CSP-CHANNEL ***] ' + name + ' sending event via handler downstream event=' + JSON.stringify(event));
            return result;
        },
        sendUpstream: function(event) {
            logger.debug('[*** CSP-CHANNEL ***] ' + name + ' sending event via handler upstream event.id=' + event.id);
            var result = incomingFunction(event);
            logger.trace('[*** CSP-CHANNEL ***] ' + name + ' sending event via handler upstream event=' + JSON.stringify(event));
            return result;
        },
        upstreamConnection: function(c) {
            upstreamConnection = c;
        },
        downstreamConnection: function(c) {
            downstreamConnection = c;
        },
        otherConnection(conn) {
            if (conn === upstreamConnection.name()) {
                logger.trace('[*** CSP-CHANNEL ***]  ' + name + ' other connection is downstream: ' + downstreamConnection.name());
                return downstreamConnection;
            } else {
                logger.trace('[*** CSP-CHANNEL ***] ' + name + ' other connection is upstream: ' + upstreamConnection.name());
                return upstreamConnection;
            }
        }
    };

}
