var assert = require('assert');
var amqp = require("../../muon/transport/amqp/amqp-transport.js");
require('sexylog');
var bichannel = require('../../muon/channel/bi-channel.js');


describe("AMQP Transport Test", function () {


    it("transport sends and receives messages ", function (done) {

        var channel = bichannel.create("test-amqp-channel");

          var amqpClient = function(connection) {
                 connection.send("amqp test message");
                 connection.listen(function(response) {
                         assert.equal(response, "amqp test message");
                         done();
                 });
          }

         amqp.connect('amqp://muon:microservices@localhost', 'test-queue', channel.right());
         amqpClient(channel.left());

    });

});
