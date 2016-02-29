var _ = require("underscore");
var bichannel = require('../../infrastructure/channel');

var AmqpConnection = require("./amqp-connection");
var ServiceQueue = require("./service-queue");
var AmqpQueue = require("./amqp-queues");
var uuid = require('node-uuid');

var Amqp09Transport = function (serviceName, connection, url) {
    this.connection = new AmqpConnection(url);
    this.connection.connect(function() {
        this.queues = new AmqpQueue(this.connection);
        this.serviceQueue = new ServiceQueue(serviceName, connection, this.connection);
        logger.info("[***** TRANSPORT *****] Amqp09Transport() serviceName: " + serviceName);
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
            logger.trace("[***** TRANSPORT *****] send " + this.outboundBuffer.length + " pending messages");
            this.outboundBuffer = [];
        },
        shutdown: function() {
            logger.info("[***** TRANSPORT *****] CHANNEL POISONED");

            this.send({
                headers:{
                    eventType:"ChannelShutdown",
                    id:"simples",
                    targetService:"",
                    sourceService:"",
                    protocol:"",
                    "Content-Type":"application/json",
                    sourceAvailableContentTypes:["application/json"],
                    channelOperation:"CLOSE_CHANNEL"
                },
                payload:{
                    be:"happy"
                }
            });
            this.listener.shutdown();
            transport.connection.queueDelete(this.sendQueue);
            transport.connection.queueDelete(this.receiveQueue);
        },
        send: function(msg) {

            var amqpMessage = {
                headers: msg.headers,
                payload:msg.payload
            };

            logger.info("[***** TRANSPORT *****] Sending event outbound to amqp transport");
            transport.queues.send(this.sendQueue, amqpMessage);
        }
    };

    channelConnection.channel = bichannel.create("amqp-transport");

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
};

Amqp09Transport.prototype.startHandshake = function(channelConnection) {


    //channelConnection.sendQueue = "node-service-send";
    //channelConnection.receiveQueue = "node-service-recieve";

    handshakeId = uuid.v4();
    var serviceQueueName = "service." + channelConnection.serviceName;
    channelConnection.sendQueue = channelConnection.serviceName + ".send." + handshakeId;
    channelConnection.receiveQueue = channelConnection.serviceName + ".receive." + handshakeId;


    channelConnection.listener = this.queues.listen(channelConnection.receiveQueue, function(message) {
        logger.info('[***** TRANSPORT *****] message received: ' + JSON.stringify(message));
        if (channelConnection.channelOpen == false) {
            channelConnection.drainQueue();
            channelConnection.channelOpen = true;
            return; // we got a handshake response
        }
        channelConnection.channel.rightConnection().send(message);
    });



    this.queues.send(serviceQueueName, {
        headers: {
            PROTOCOL:channelConnection.protocolName,
            SOURCE_SERVICE:"",
            REPLY_TO:channelConnection.receiveQueue,
            LISTEN_ON:channelConnection.sendQueue
        }
    })
};

Amqp09Transport.prototype.shutdown = function() {
    //TODO, more shutdowns.
    logger.info("shutting down transport");
};


module.exports = Amqp09Transport;

