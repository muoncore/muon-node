var _ = require("underscore");
var bichannel = require('../../../infrastructure/channel');

var AmqpQueue = require("./amqp-queues");

var ServiceQueue = function (serviceName, serverStacks, connection) {
    this.serviceName = serviceName;
    this.connection = connection;
    this.queues = new AmqpQueue(this.connection);

    this.onHandshake(function(handshake) {
        var protocol = handshake.headers.PROTOCOL;
        var receiveQueue = handshake.headers.LISTEN_ON;
        var sendQueue = handshake.headers.REPLY_TO;

        var serverChannel = serverStacks.openChannel(protocol);

        //open a listener on the receive queue. pass all messages into tserverStacks.openChannelhe channel
        var q = this.queues.listen(receiveQueue, function(data) {
            //transform to transport payload?
            logger.info("Received data on the Channel Receive Queue");
            serverChannel.send(data);
        });

        serverChannel.listen(function(data) {
            logger.info("CHANNEL SEND");
            if (data == "poison") {
                q.shutdown();
            } else {
                this.queues.send(sendQueue, data);
            }
        }.bind(this));

        this.queues.send(sendQueue, {
            headers:{
                eventType:"handshakeAccepted",
                PROTOCOL:protocol
            }
        });
    }.bind(this));
};

ServiceQueue.prototype.onHandshake = function(callback) {

    //listen on queue.
    this.queues.listen("service." + this.serviceName, function(message) {
        logger.info("GOT DATA ON Service queue!!!");
        callback(message)
    });
};

module.exports = ServiceQueue;
