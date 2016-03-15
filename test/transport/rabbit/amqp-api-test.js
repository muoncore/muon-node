var amqpApi = require('../../../muon/transport/rabbit/amqp-api.js');
var assert = require('assert');
var expect = require('expect.js');

describe("mamqp api test", function () {

    this.timeout(4000);

      after(function() {
            //bi-channel.closeAll();
      });

    it("send receive message", function (done) {
            var url = "amqp://muon:microservices@localhost";
            amqpApi.connect(url, function(err, api) {
                if (err) {
                    throw new Error('error connecting to amqp ' + err);
                    done();
                } else {
                    var payload = {message: "amqp_api_test_message"};
                    console.log('sending payload');
                    api.publish('api_test_queue', payload, {});
                    console.log('waiting for message');
                    api.consume('api_test_queue', function(err, msg) {
                        console.log('message received');
                        assert.equal(msg.message, payload.message);
                        done();
                    });
                }

            });

    });


});