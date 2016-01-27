require('sexylog');




module.exports.create = function() {

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
            logger.debug('sending event via handler downstream');
            var result = outgoingFunction(event);
            logger.debug('returning handler result=' + result);
            return result;
        },
        sendUpstream: function(event) {
            logger.debug('sending event via handler upstream');
            var result = incomingFunction(event);
            logger.debug('returning handler result=' + result);
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
                logger.trace('other connection is downstream: ' + downstreamConnection.name());
                return downstreamConnection;
            } else {
                logger.trace('other connection is upstream: ' + upstreamConnection.name());
                return upstreamConnection;
            }
        }
    };

}
