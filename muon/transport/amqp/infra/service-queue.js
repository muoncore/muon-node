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

        logger.trace('opening serverStacks channel with protocol: ' + protocol);
        logger.trace('receiveQueue/sendQueue ' + receiveQueue + '/' + sendQueue);
        var serverChannel = serverStacks.openChannel(protocol);
       logger.trace("created server stacks channel " + serverChannel.name);
        //console.dir(serverStacks);

        //open a listener on the receive queue. pass all messages into tserverStacks.openChannelhe channel
        var q = this.queues.listen(receiveQueue, function(data) {
            //transform to transport payload?
            logger.info("********* Received data on the Channel Receive Queue");
            data['id'] = data.headers.id;
            console.dir(data);
            serverChannel.send(data);
        });

        serverChannel.listen(function(data) {
            logger.info("Server Stack transport channel: downstream data received, sendign to amqp queue: event=" + JSON.stringify(data));
            console.dir(data);
            if (data == "poison") {
                q.shutdown();
            } else {
                this.queues.send(sendQueue, data);
            }
        }.bind(this));

        logger.debug("Sending server handshake to amqp queue: " + sendQueue);
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
    var queueName = "service." + this.serviceName;
    this.queues.listen(queueName, function(message) {
        logger.info('DATA RECEIVED on server stack AMQP queue: "' + queueName + '" Event:');
        console.dir(message);
        callback(message)
    });
};

module.exports = ServiceQueue;
