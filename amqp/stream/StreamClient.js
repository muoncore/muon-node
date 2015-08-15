/**
 * Implements the client side of the Muon/AMQP streaming system.
 *
 * Uses a js-signals based dispatcher for most observable events.
 *
 * The format of these should be shared with other streaming clients.
 */
var Url = require("url");
var uuid = require("node-uuid");
var signals = require("signals");

module.exports = function(queues) {

    var cl = this;

    //signals designed for external consumption.
    cl.dataReceived = new signals.Signal();
    cl.subscribed = new signals.Signal();
    cl.errored = new signals.Signal();
    cl.completed = new signals.Signal();

    //internal dispatcher. All inbound messages go here for further dynamic dispatch.
    cl.inboundMessageReceived = new signals.Signal();

    cl.connection = {
        subscriberId:null,
        streamName:null,
        replyQueue:null,
        remoteCommandQueue:null
    };

    cl.subscribed.add(function(message) {
        cl.connection.subscriberId = message.headers["SUBSCRIPTION_STREAM_ID"];
    });
    cl.errored.add(clearKeepAlive);
    cl.completed.add(clearKeepAlive);

    this.inboundMessageReceived.add(function(data) {
        if (data.headers["TYPE"] == "data") {

            cl.dataReceived.dispatch(
                data, data.payload);
        } else {
            switch (data.headers.command) {
                case "ERROR":
                    cl.errored.dispatch(data);
                    break;
                case "COMPLETE":
                    cl.completed.dispatch(data);
                    break;
                case "SUBSCRIPTION_ACK":
                    cl.subscribed.dispatch(data);
                    break;
                case "SUBSCRIPTION_NACK":
                    cl.errored.dispatch(data);
                    break;
            }
        }
    });

    cl.requestData = function(count) {
        queues.send(cl.connection.remoteCommandQueue, {
            headers:{
                command:"REQUEST",
                REQUESTED_STREAM_NAME: cl.connection.streamName,
                SUBSCRIPTION_STREAM_ID: cl.connection.subscriberId,
                REPLY_QUEUE_NAME:cl.connection.replyQueue,
                N:count
            },
            payload:{}
        });
    };

    cl.cancel = function(){
        clearKeepAlive();
        queues.send(cl.connection.remoteCommandQueue, {
            headers:{
                command:"CANCEL",
                SUBSCRIPTION_STREAM_ID: cl.connection.subscriberId,
                REPLY_QUEUE_NAME:cl.connection.replyQueue
            },
            payload:{}
        });
    };

    cl.subscribe = function(url) {
        var u = Url.parse(url, true);

        cl.connection.streamName = u.pathname;
        cl.connection.remoteCommandQueue = u.hostname + "_stream_control";

        cl.connection.replyQueue = "streamdata." + uuid.v1();

        queues.listen(cl.connection.replyQueue, function(data, message) {
            cl.inboundMessageReceived.dispatch(data);
        });

        var headers = {
            command:"SUBSCRIBE",
                REQUESTED_STREAM_NAME: cl.connection.streamName,
            "KEEPALIVE_QUEUE_NAME":cl.connection.replyQueue,
            "REPLY_QUEUE_NAME":cl.connection.replyQueue
        };

        for(var k in u.query) headers[k]= u.query[k];

        queues.send(cl.connection.remoteCommandQueue, {
            headers:headers,
            payload:{}
        });

        cl.interval = setInterval(sendKeepAlive, 3500);
    };


    function clearKeepAlive() {
        clearInterval(cl.interval);
    }
    function sendKeepAlive() {
        queues.send(cl.connection.remoteCommandQueue, {
            headers:{
                command:"KEEP-ALIVE",
                SUBSCRIPTION_STREAM_ID: cl.connection.subscriberId
            }
        });
    }
};
