var amqp = require('../../../muon/transport/rabbit/amqp-api.js');
var assert = require('assert');
var expect = require('expect.js');
var messageHelper = require('../../../muon/domain/messages.js');

describe("amqp api test", function () {

    this.timeout(8000);

      after(function() {

      });

    it("send and receive a simple message", function (done) {
            var url = "amqp://muon:microservices@localhost";
            var numMessages = 1;
            var messageCount = 0;

            console.log('connecting via amqp api');
            var amqpConnect = amqp.connect(url);

            console.log('connect.tehn()...');
             amqpConnect.then(function (amqpApi) {

                   var payload = {text: "amqp_api_test_message"};

                   console.log('waiting for message');
                   amqpApi.inbound('api_test_queue').listen(function(message) {
                       console.log('message received: ' + JSON.stringify(message));
                       assert.equal(message.payload.text, payload.text);
                       messageCount++;
                       if (messageCount == numMessages) {
                            done();
                       }

                   });
                  console.log('sending payload');
                  for (var i = 0 ; i < numMessages ; i++) {
                            payload.id = i;
                            var message = messageHelper.rpcMessage(payload, 'testclient', 'muon://testserver/ping');
                            amqpApi.outbound('api_test_queue').send(message);
                  }

            }, function (err) {
                console.log("muon promise.then() error!!!!!");
                throw new Error('error in return amqp-api promise');
            }).catch(function(error) {
               console.log("amqp-api-test.js connection.then() error!!!!!: " + error);
                throw new Error('error in return muon promise in amqp-api-test-test.js', error);

            });

    });

});