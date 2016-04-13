
require('mocha-sinon');
var sinon = require("sinon");
var assert = require('assert');
var url = require('url');
var _ = require('underscore');
var AmqpTransport = require("../../../muon/transport/amqp.old/amqp09-transport");
var logger = require('sexylog');
var channel = require('../../../muon/infrastructure/channel.js');
require('sexylog');


describe("AMQP Transport", function () {

/*
    this.timeout(5000);
     var channel2 = channel.create('server');
    var transport1 =  new AmqpTransport("transport1", channel2.rightConnection(), "amqp://muon:microservices@localhost");
    var transport2 =  new AmqpTransport("transport2", channel2.rightConnection(), "amqp://muon:microservices@localhost");

    afterEach(function() {
        //transport1.shutdown();
        //transport2.shutdown();
    });

    it("Transports can exchange data over a broker", function (done) {
        //this.timeout(25000);

        var data1 = "PING";
        var data2 = "PONG";

        setTimeout(function() {
            var channel1 = transport1.openChannel("transport1", "fakeproto");



            //console.dir(channel);
            var event = {
                payload: data1
            };
            channel1.send(event);


            channel2.leftConnection().listen(function(event) {
                console.log('event=' + JSON.stringify(event));
                if (event.headers.eventType != 'handshakeAccepted') {
                    assert.equal(event.payload.data.toString(), data1);
                    done();
                }
            });

        }, 500);
    });

    */
});
