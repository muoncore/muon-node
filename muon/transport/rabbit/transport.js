var client = require('./transport-client.js');
var transport = require('./transport-server.js');
var bichannel = require('../../infrastructure/channel');




function newChannel(serviceName, protocolName) {



    /*

    channelConnection.channel.rightConnection().listen(function(msg) {
            logger.info("[***** TRANSPORT *****] received outbound event");
            if (msg == "poison") {
                channelConnection.shutdown();
                return;
            }
            if(channelConnection.channelOpen) {
                channelConnection.send(msg);
            } else {
                channelConnection.outboundBuffer.push(msg);
            }
        }.bind(channelConnection));

        this.startHandshake(channelConnection);

        return channelConnection.channel.leftConnection();

    */


}




exports.create = function (serviceName, serverStacks, url) {

    var serverStacksChannel = serverStacks.openChannel(protocolName);
    server.connect(serviceName, serverStacksChannel, url);

    var transport = {
        openChannel: function(serviceName, protocolName) {
            logger.debug('[*** ***]');
            var transportClientChannel = client.connect(serviceName, url);
            return transportClientChannel;
        }
    }
    return transport;

}