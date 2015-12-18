var assert = require('assert');
var amqp = require("../../muon/transport/amqp/amqp-transport.js");
require('sexylog');


describe("AMQP Transport Test", function () {


    it("transport sends and receives messages ", function (done) {

          var amqpClient = function(channel) {
                 channel.send("amqp test message");
                 channel.listen(function(response) {
                         assert.equal(response, "amqp test message");
                         done();
                 });
          }

         amqp.connect('amqp://muon:microservices@localhost', function(transport) {
            amqp.openChannel("test-service", function(channel) {
                    amqpClient(channel);
            });
         });



    });

});
