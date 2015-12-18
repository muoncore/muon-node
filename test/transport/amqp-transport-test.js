var assert = require('assert');
var amqp = require("../../muon/transport/amqp/amqp-transport.js");
require('sexylog');


describe("AMQP Transport Test", function () {

  before(function(done) {
          amqp.connect('amqp://muon:microservices@localhost', function(transport) {
               done();
          });
  });


    it("transport sends and receives messages ", function (done) {

            amqp.openChannel("test-echo-service", function(channel) {
                 channel.send("amqp test message");
                 channel.listen(function(response) {
                         assert.equal(response, "amqp test message");
                         done();
                 });
            });
    });

});
