var client = require('./client.js');
var server = require('./server.js');
var bichannel = require('../../infrastructure/channel.js');


exports.create = function (localServiceName, url, serverStacks, discovery) {
    logger.info('[*** TRANSPORT:BOOTSTRAP ***] creating new MUON AMQP Transport connection with url=' + url);

    var upstreamCallback;

    var transportErrCallback = function (err) {
        logger.error('[*** TRANSPORT:ERROR ***] ' + err);
        if (upstreamCallback) {
            upstreamCallback(err);
        }
    }

    server.connect(localServiceName, url, serverStacks, discovery);
    server.onError(transportErrCallback);

    var transport = {
        openChannel: function (remoteServiceName, protocolName) {
            logger.debug('[*** TRANSPORT:OPEN-CONNECTION ***] opening muon connect to remote service ' + remoteServiceName);
            var transportClientChannel = client.connect(remoteServiceName, protocolName, url, discovery);
            client.onError(transportErrCallback);
            return transportClientChannel;
        },
        onError: function (cb) {
            upstreamCallback = cb;
        }

    }
    return transport;

}