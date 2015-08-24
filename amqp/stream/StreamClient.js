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

var StreamClient = function (queues) {

    var cl = this;
    this.queues = queues;

    //signals designed for external consumption.
    cl.dataReceived = new signals.Signal();
    cl.subscribed = new signals.Signal();
    cl.errored = new signals.Signal();
    cl.completed = new signals.Signal();

    //internal dispatcher. All inbound messages go here for further dynamic dispatch.
    cl.inboundMessageReceived = new signals.Signal();

    cl.connection = {
        subscriberId: null,
        streamName: null,
        replyQueue: null,
        remoteCommandQueue: null
    };

    cl.subscribed.add(function (message) {
        cl.connection.subscriberId = message.headers["SUBSCRIPTION_STREAM_ID"];
    });
    cl.errored.add(this.clearKeepAlive);
    cl.completed.add(this.clearKeepAlive);
    cl.inboundMessageReceived.add(function (data) {
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
};

StreamClient.prototype.requestData = function (count) {
    var _this = this;
    this.queues.send(this.connection.remoteCommandQueue, {
        headers: {
            command: "REQUEST",
            REQUESTED_STREAM_NAME: _this.connection.streamName,
            SUBSCRIPTION_STREAM_ID: _this.connection.subscriberId,
            REPLY_QUEUE_NAME: _this.connection.replyQueue,
            N: count
        },
        payload: {}
    });
};

StreamClient.prototype.cancel = function () {
    this.clearKeepAlive();
    var _this = this;
    this.queues.send(this.connection.remoteCommandQueue, {
        headers: {
            command: "CANCEL",
            SUBSCRIPTION_STREAM_ID: _this.connection.subscriberId,
            REPLY_QUEUE_NAME: _this.connection.replyQueue
        },
        payload: {}
    });
};

StreamClient.prototype.subscribe = function (url) {
    var _this = this;
    var u = Url.parse(url, true);

    this.connection.streamName = u.pathname;
    this.connection.remoteCommandQueue = u.hostname + "_stream_control";

    this.connection.replyQueue = "streamdata." + uuid.v1();

    this.queues.listen(this.connection.replyQueue, function (data, message) {
        _this.inboundMessageReceived.dispatch(data);
    });

    var headers = {
        command: "SUBSCRIBE",
        REQUESTED_STREAM_NAME: this.connection.streamName,
        "KEEPALIVE_QUEUE_NAME": this.connection.replyQueue,
        "REPLY_QUEUE_NAME": this.connection.replyQueue
    };

    for (var k in u.query) headers[k] = u.query[k];

    this.queues.send(this.connection.remoteCommandQueue, {
        headers: headers,
        payload: {}
    });

    this.interval = setInterval(function() {
        _this.sendKeepAlive();
    }, 3500);
};

StreamClient.prototype.clearKeepAlive = function () {
    clearInterval(this.interval);
};

StreamClient.prototype.sendKeepAlive = function () {
    this.queues.send(this.connection.remoteCommandQueue, {
        headers: {
            command: "KEEP-ALIVE",
            SUBSCRIPTION_STREAM_ID: this.connection.subscriberId
        }
    });
};

module.exports = StreamClient;
