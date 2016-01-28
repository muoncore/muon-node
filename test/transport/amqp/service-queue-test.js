
require('mocha-sinon');
var sinon = require("sinon");
var assert = require('assert');
var url = require('url');
var _ = require('underscore');
var Channel = require("../../../muon/infrastructure/channel");
var AmqpConnection = require("../../../muon/transport/amqp/infra/amqp-connection");
var AmqpQueues = require("../../../muon/transport/amqp/infra/amqp-queues");
var ServiceQueue = require("../../../muon/transport/amqp/infra/service-queue");
var ServerStacks = require("../../../muon/server-stacks");

describe("AMQP Service Queue", function () {

    beforeEach(function() {

    });

    it("ServiceQueue opens a channel on ServerStacks when handshake message is received", function (done) {
        this.timeout(25000);

        var openedProtocol;
        var rightdata = null;
        var leftdata = null;


        var connection = new AmqpConnection("amqp://muon:microservices@localhost");

        var serverStacks = {
            openChannel: function(data) {

                openedProtocol = data;
                logger.info("OPEN CHANNEL CALLED " + data);
                var channel = Channel.create("simples");
                channel.leftConnection().listen(function(dat) {
                   logger.info("The server channel recieved data...");
                    console.dir(dat);
                    if (rightdata == null) {
                        rightdata = dat;
                        channel.leftConnection().send({payload:{ name: "awesomes"}});
                    }
                });

                return channel.rightConnection();
            }
        };

        var serviceName = "tombola";
        var protoName = "fakeProto";

        var leftToRightQueue = "blah-right";
        var rightToLeftQueue = "blah-left";

        connection.connect(function() {
            queues = new AmqpQueues(connection);
            var serviceQueue = new ServiceQueue(serviceName, serverStacks, connection);

            queues.listen(leftToRightQueue, function(data) {
                //listen for the handshake reply coming back from the service queue.
                logger.info("Test queue received data");

                console.dir(data);

                if (leftdata == null || data.headers.eventType!="handshakeAccepted") {
                    leftdata = data;
                    queues.send(rightToLeftQueue, {
                        headers: {
                            PROTOCOL: "fakeProto"
                        },
                        payload: {
                            "hello": "world"
                        }
                    });
                }
            });

            queues.send("service.tombola", {
                headers: {
                    PROTOCOL:protoName,
                    SOURCE_SERVICE:"simples",
                    REPLY_TO:leftToRightQueue,
                    LISTEN_ON:rightToLeftQueue
                }});
        });

        setTimeout(function() {

            assert.equal(openedProtocol, "fakeProto");
            assert.equal(leftdata.payload.name, "awesome");

            done();
        },3000);
    });
});
