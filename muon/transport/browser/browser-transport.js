var _ = require("underscore");
var bichannel = require('../../infrastructure/channel');
var uuid = require("node-uuid");

var BrowserTransport = function (serviceName, serverStacks, url) {
    this.ws = new WebSocket(url, "protocolOne");

    this.channelConnections = {};
    var transport = this;

    this.ws.onmessage = function (event) {
        //TODO, lookup the channelconnection based on the channelId
        console.log("MESSAGE RECEIVED FROM SERVER: " + JSON.stringify(event.data));

        var data = JSON.parse(event.data);
        var channelId = data.headers.channelId;

        var connection = transport.channelConnections[channelId];

        connection.channel.rightConnection().send(data);
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

    //TODO, do we need a queue?

    var channelConnection = {
        channelId:uuid.v1(),
        serviceName: serviceName,
        protocolName: protocolName,
        channelOpen:true,
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
            console.log("Sending!!!!!!!!!")
            try {
                msg.headers.targetService = channelConnection.serviceName;
                msg.headers.channelId = channelConnection.channelId;
                msg.headers.PROTOCOL = channelConnection.protocolName;

                var message = {
                    headers: msg.headers,
                    payload: msg.payload
                };

                var out = JSON.stringify(message);

                logger.info("[***** TRANSPORT *****] Sending event outbound to browser transport " + out);
                transport.ws.send(out);
            } catch (err) {
                console.log("ERROROROR");
            }
        }
    };

    this.channelConnections[channelConnection.channelId] = channelConnection;

    channelConnection.channel = bichannel.create("browser-transport");

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

    return channelConnection.channel.leftConnection();
};


BrowserTransport.prototype.shutdown = function() {
    //TODO, more shutdowns.
};

module.exports = BrowserTransport;

