var client = require('./client.js');
var server = require('./server.js');
var bichannel = require('../../infrastructure/channel.js');




exports.create = function (localServiceName, serverStacks, url) {
    logger.info('[*** TRANSPORT:BOOTSTRAP ***] creating new MUON AMQP Transport connection with url=' + url);
    var protocolName = 'no-protocol-defined-yet';
    server.connect(localServiceName, protocolName, serverStacks, url);

    var transport = {
        openChannel: function(remoteServiceName, protocolName) {
            logger.debug('[*** TRANSPORT:OPEN-CONNECTION ***] opening muon connect to remote service ' + remoteServiceName);
            var transportClientChannel = client.connect(remoteServiceName, url);
            return transportClientChannel;
        }
    }
    return transport;

}