var _ = require("underscore");
var bichannel = require('../../infrastructure/channel');
var uuid = require("node-uuid");

var BrowserTransport = function (serviceName, serverStacks, url) {
    this.ws = new WebSocket(url, "protocolOne");

    this.channelConnections = [];

    this.ws.onmessage = function (event) {
        //TODO, lookup the channelconnection based on the channelId
        console.log("MESSAGE RECEIVED FROM SERVER");
    };

    //todo, on close, open the websocket connection again.

    //need some way to "create" a channel.
    /*
    create a channel identifier. regsiter the channel connection with that ident

    send a channel open message to the server side.

    the dispatch the rest....
     */

};

BrowserTransport.prototype.openChannel = function(serviceName, protocolName) {

    var transport = this;

    var channelConnection = {
        channelId:uuid.v1(),
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
        },
        send: function(msg) {

            var message = {
                headers: msg.headers,
                payload:msg.payload
            };

            logger.info("[***** TRANSPORT *****] Sending event outbound to browser transport");
            //console.dir(msg);
            transport.ws.send({
                headers: {
                    targetService: channelConnection.serviceName,
                    channelId:channelConnection.channelId,
                    PROTOCOL:channelConnection.protocolName,
                    SOURCE_SERVICE:""
                }
            });

        }
    };

    channelConnection.channel = bichannel.create("browser-transport");

    channelConnection.channel.rightConnection().listen(function(msg) {
        logger.info("[***** TRANSPORT *****] received outbound event");
        if (msg == "poison") {
            channelConnection.shutdown();
            return;
        }
        //console.dir(msg);
        if(channelConnection.channelOpen) {
            channelConnection.send(msg);
        } else {
            channelConnection.outboundBuffer.push(msg);
        }
    }.bind(channelConnection));

    this.startHandshake(channelConnection);

    return channelConnection.channel.leftConnection();
};

BrowserTransport.prototype.startHandshake = function(channelConnection) {

    this.ws.onopen(function() {
        this.ws.send({
            headers: {
                targetService: channelConnection.serviceName,
                channelId:channelConnection.channelId,
                PROTOCOL:channelConnection.protocolName,
                SOURCE_SERVICE:""
            }
        });
    });

};

BrowserTransport.prototype.shutdown = function() {
    //TODO, more shutdowns.
};

module.exports = BrowserTransport;

