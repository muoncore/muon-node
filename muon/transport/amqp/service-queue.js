var _ = require("underscore");
var bichannel = require('../../infrastructure/channel');
var AmqpConnection = require("./amqp-connection");

var AmqpQueue = require("./amqp-queues");

var ServiceQueue = function (serviceName, serverChannel, connection) {
    this.serviceName = serviceName;
    this.connection = connection;
    this.queues = new AmqpQueue(this.connection);

    this.onHandshake(function(handshake) {
        var protocol = handshake.headers.PROTOCOL;
        var receiveQueue = handshake.headers.LISTEN_ON;
        var sendQueue = handshake.headers.REPLY_TO;

        logger.trace('[***** TRANSPORT *****] opening serverStacks channel with protocol: ' + protocol);
        logger.trace('[***** TRANSPORT *****] receiveQueue/sendQueue ' + receiveQueue + '/' + sendQueue);
       logger.trace("[***** TRANSPORT *****] created server stacks channel " + serverChannel.name);


        //open a listener on the receive queue. pass all messages into tserverStacks.openChannelhe channel
        var q = this.queues.listen(receiveQueue, function(data) {
            //transform to transport payload?
            logger.info("[***** TRANSPORT *****] Received data on server stack amqp transport queue");
            data['id'] = data.headers.id;
            serverChannel.send(data);
        });

        serverChannel.listen(function(data) {
            var id = "unknown";
            if (data.headers !== undefined) {
                id = data.headers.id;
            }
            logger.info("[***** TRANSPORT *****] Server Stack transport channel: downstream data received, sending to amqp queue '" + sendQueue + "' event.id=" + id);
            if (data == "poison") {
                q.shutdown();
            } else {
                this.queues.send(sendQueue, data);
            }
        }.bind(this));

        logger.debug("[***** TRANSPORT *****] Sending server handshake to amqp queue: " + sendQueue);
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
        logger.info('[***** TRANSPORT *****] DATA RECEIVED on server stack AMQP queue: "' + queueName + '" Event:' + JSON.stringify(message));
        callback(message)
    });
};

module.exports = ServiceQueue;
