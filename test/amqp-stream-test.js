
var Logger = require('../lib/logging/logger');
var StreamClient = require("../core/transport/amqp/stream/StreamClient.js");
var queues = require("../core/transport/amqp/amqp-queues.js");
var Connection = require("../core/transport/amqp/amqp-connection.js");

require('mocha-sinon');
var sinon = require("sinon");
var assert = require('assert');
var url = require('url');
var _ = require('underscore');
var q;
var fakeQueue;
var mockqueues;

describe("AMQP Stream Client", function () {

    beforeEach(function() {
        fakeQueue = {
            send: function(queueName, event) {},
            listen: function(queueName, callback) {}
        };
        //clock = sinon.useFakeTimers();
        mockqueues = sinon.mock(fakeQueue);
    });

    //afterEach(function() {
    //    clock.restore();
    //});

    it("emits SUBSCRIBE when requested to", function () {
        mockqueues.expects("send").once().withArgs("remote_stream_control",
            sinon.match({
                headers:{
                    command:"SUBSCRIBE",
                    "REQUESTED_STREAM_NAME":"/something"
                }
            }));

        var client = new StreamClient(fakeQueue);

        client.subscribe("muon://remote/something");

        mockqueues.verify();
    });

    it("listens on reply queue when sending SUBSCRIBE", function () {
        mockqueues.expects("send").once().withArgs("remote_stream_control",
            sinon.match({
                headers:{
                    command:"SUBSCRIBE",
                    "REQUESTED_STREAM_NAME":"/something",
                    "KEEPALIVE_QUEUE_NAME":sinon.match.string,
                    "REPLY_QUEUE_NAME":sinon.match.string
                }
            }));

        mockqueues.expects("listen").once().withArgs(sinon.match.string, sinon.match.func);

        var client = new StreamClient(fakeQueue);

        client.subscribe("muon://remote/something");

        mockqueues.verify();
    });

    it("dispatches DATA messages to the listeners", function (done) {

        var client = new StreamClient(fakeQueue);
        client.connection.streamName="/something";
        client.dataReceived.add(function(data) {
            assert.equal(data.headers.TYPE, "data");
            done()
        });

        client.inboundMessageReceived.dispatch({
            headers:{
                "TYPE":"data",
                "SUBSCRIPTION_STREAM_ID":"12345"
            },
            payload: {
                data :JSON.stringify({
                    "msg": "awesome"
                })
            }
        });

        mockqueues.verify();
    });

    it("dispatches ERROR messages to the listeners", function (done) {

        var client = new StreamClient(fakeQueue);
        client.connection.streamName="/something";
        client.errored.add(function(data) {
            assert.equal(data.headers.command, "ERROR");
            done()
        });

        client.inboundMessageReceived.dispatch({
            headers:{
                "command":"ERROR"
            }
        });

        mockqueues.verify();
    });

    it("dispatches COMPLETE messages to the listeners", function (done) {

        var client = new StreamClient(fakeQueue);
        client.connection.streamName="/something";
        client.completed.add(function(data) {
            assert.equal(data.headers.command, "COMPLETE");
            done()
        });

        client.inboundMessageReceived.dispatch({
            headers:{
                "command":"COMPLETE"
            }
        });

        mockqueues.verify();
    });

    it("sends COMPLETE to server on demand", function () {
        //subscribe.
        mockqueues.expects("send").once().withArgs("remote_stream_control",
            sinon.match({
                headers:{
                    command:"CANCEL",
                    "REPLY_QUEUE_NAME":"simples",
                    SUBSCRIPTION_STREAM_ID:"12345"}
            }));

        var client = new StreamClient(fakeQueue);
        client.connection.streamName="/something";
        client.connection.remoteCommandQueue="remote_stream_control";
        client.connection.subscriberId="12345";
        client.connection.replyQueue="simples";

        client.cancel();

        mockqueues.verify();
    });

    //sends keep-alive to the server during a connection.
    //expires the connection with an ERROR if the server doesn't send keep-alive

});