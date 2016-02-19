
module.exports.create = function(n) {

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
            logger.debug('[*** CHANNEL ***] ' + name + ' sending event via handler downstream');
            var result = outgoingFunction(event);
            logger.debug('[*** CHANNEL ***] ' + name + ' returning handler result=' + JSON.stringify(result));
            return result;
        },
        sendUpstream: function(event) {
            logger.debug(name + ' sending event via handler upstream');
            var result = incomingFunction(event);
            logger.debug('[*** CHANNEL ***] ' + name + ' returning handler result=' + JSON.stringify(result));
            return result;
        },
        upstreamConnection: function(c) {
            upstreamConnection = c;
        },
        downstreamConnection: function(c) {
            downstreamConnection = c;
        },
        otherConnection(conn) {
            //logger.info('conn: ');
            //console.dir(conn);
            if (conn === upstreamConnection.name()) {
                logger.trace('[*** CHANNEL ***]  ' + name + ' other connection is downstream: ' + downstreamConnection.name());
                return downstreamConnection;
            } else {
                logger.trace('[*** CHANNEL ***] ' + name + ' other connection is upstream: ' + upstreamConnection.name());
                return upstreamConnection;
            }
        }
    };

}
