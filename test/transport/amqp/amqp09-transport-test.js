
require('mocha-sinon');
var sinon = require("sinon");
var assert = require('assert');
var url = require('url');
var _ = require('underscore');
var AmqpTransport = require("../../../muon/transport/amqp/amqp09-transport");
var ServerStacks = require("../../../muon/server-stacks");

describe("AMQP Transport", function () {

    beforeEach(function() {

    });

    it("Transports can exchange data over a broker", function (done) {
        this.timeout(25000);

        var data1 = "FAKED";
        var data2 = "FAKED";
        var serverStacks = new ServerStacks();
        //serverStacks.addProtocol("fakeproto", XXX);
        //server stack should set data2 to payload.

        var transport1 = new AmqpTransport("transport1", {}, "amqp://muon:microservices@localhost");
        var transport2 = new AmqpTransport("transport2", serverStacks, "amqp://muon:microservices@localhost");

        setTimeout(function() {
            var channel = transport1.openChannel("transport2", "fakeproto");

            console.dir(channel);
            channel.listen(function(data) {
                data1 = data;
            });

            setTimeout(function() {
                assert.equal(data1, "from transport2");
                assert.equal(data2, "from transport1");
                done();
            }, 10000);

        }, 500);
    });
});