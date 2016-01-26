var _ = require("underscore");
var bichannel = require('../../channel/bi-channel');

var AmqpConnection = require("./infra/amqp-connection");
var AmqpQueue = require("./infra/amqp-queues");

var Amqp09Transport = function (url) {
    this.connection = new AmqpConnection(url);
    this.connection.connect(function() {
        this.queues = new AmqpQueue(this.connection);
    }.bind(this));
};

Amqp09Transport.prototype.openChannel = function(serviceName, protocolName) {

    var transport = this;

    var channelConnection = {
        serviceName: serviceName,
        protocolName: protocolName,
        channelOpen:false,
        outboundBuffer:[],
        drainQueue: function() {

            _.each(this.outboundBuffer, function(el) {
                this.send(el);
            }.bind(this));
            console.info("send " + this.outboundBuffer.length + " pending messages");
            this.outboundBuffer = [];
        },
        shutdown: function() {
            logger.info("CHANNEL POISONED");
        },
        send: function(msg) {

            var amqpMessage = {
                headers: msg.headers,
                payload:msg.payload
            };

            logger.info("SENDING MESSAGE!");
            console.dir(msg);



            transport.queues.send(this.sendQueue, amqpMessage);
        }
    };

    channelConnection.channel = bichannel.create("test-channel");

    channelConnection.channel.right().listen(function(msg) {
        logger.info("Sending message");
        if (msg == "poison") {
            channelConnection.shutdown();
            return;
        }
        console.dir(msg);
        if(channelConnection.channelOpen) {
            channelConnection.send(msg);
        } else {
            channelConnection.outboundBuffer.push(msg);
        }
    }.bind(channelConnection));

    this.startHandshake(channelConnection);

    return channelConnection.channel.left();
};

Amqp09Transport.prototype.startHandshake = function(channelConnection) {
    channelConnection.sendQueue = "node-service-send";
    channelConnection.receiveQueue = "node-service-recieve";

    this.queues.listen(channelConnection.receiveQueue, function(message) {
        logger.info("GOT DATA ON RECEIVE QUEUE!");
        console.dir(message);
        if (channelConnection.channelOpen == false) {
            channelConnection.drainQueue();
            channelConnection.channelOpen = true;
        }
        channelConnection.channel.right().send(message);
    });

    var serviceQueueName = "service." + channelConnection.serviceName;

    this.queues.send(serviceQueueName, {
        headers: {
            PROTOCOL:channelConnection.protocolName,
            SOURCE_SERVICE:"",
            REPLY_TO:channelConnection.receiveQueue,
            LISTEN_ON:channelConnection.sendQueue
        }
    })
};


module.exports = Amqp09Transport;

