var client = require('./client.js');
var server = require('./server.js');
var bichannel = require('../../infrastructure/channel.js');




exports.create = function(localServiceName, url, serverStacks, discovery) {
    logger.info('[*** TRANSPORT:BOOTSTRAP ***] creating new MUON AMQP Transport connection with url=' + url);
    server.connect(localServiceName, url, serverStacks, discovery);

    var transport = {
        openChannel: function(remoteServiceName, protocolName) {
            logger.debug('[*** TRANSPORT:OPEN-CONNECTION ***] opening muon connect to remote service ' + remoteServiceName);
            var transportClientChannel = client.connect(remoteServiceName, url, discovery);
            return transportClientChannel;
        }
    }
    return transport;

}