
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

        var data1;
        var data2;


        var connection = new AmqpConnection("amqp://muon:microservices@localhost");

        var serverStacks = {
            openChannel: function(data) {
                data1 = data;
                logger.info("OPEN CHANNEL CALLED");
                return Channel.create("simples").leftConnection();
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
                data2 = data;
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

            assert.equal(data1, "hello");
            assert.equal(data2, "hello");

            done();
        },3000);
    });
});
