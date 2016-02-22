
require('mocha-sinon');
var sinon = require("sinon");
var assert = require('assert');
var url = require('url');
var _ = require('underscore');
var AmqpTransport = require("../../../muon/transport/amqp/amqp09-transport");
var ServerStacks = require("../../../muon/api/server-stacks");
var logger = require('sexylog');


describe("AMQP Transport", function () {


    this.timeout(5000);
     var serverStacks = new ServerStacks();
    var transport1 =  new AmqpTransport("transport1", serverStacks, "amqp://muon:microservices@localhost");
    var transport2 =  new AmqpTransport("transport2", serverStacks, "amqp://muon:microservices@localhost");

    afterEach(function() {
        //transport1.shutdown();
        //transport2.shutdown();
    });

    it("Transports can exchange data over a broker", function (done) {
        //this.timeout(25000);

        var data1 = "PING";
        var data2 = "PONG";

        //serverStacks.addProtocol("fakeproto", XXX);
        //server stack should set data2 to payload.



        setTimeout(function() {
            var channel1 = transport1.openChannel("transport1", "fakeproto");

            var channel2 = serverStacks.openChannel("fakeproto");

            //console.dir(channel);
            var event = {
                payload: data1
            };
            channel1.send(event);

            serverStacks.register('/muon/internal/error', function(event) {
                    //logger.info('chanserverStacksnel2.register() event=' + JSON.stringify(event));
                    // headers: { eventType: 'handshakeAccepted'
                    if (event.headers.eventType != 'handshakeAccepted') {
                        assert.equal(event.payload.data.toString(), data1);
                        done();
                    }
            });

        }, 500);
    });
});
