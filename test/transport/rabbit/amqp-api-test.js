var amqp = require('../../../muon/transport/rabbit/amqp-api.js');
var assert = require('assert');
var expect = require('expect.js');
var chai = require('chai-as-promised');
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
                assert.ok(false);
            });

    });


     it("invalid amqp url string", function (done) {


            var amqpConnect = amqp.connect('blah');

             amqpConnect.then(function (amqpApi) {
                console.log("muon amqpConnect.then() status ok");
            }, function (err) {
                console.log("muon amqpConnect.then() " + err);
                var errString = 'Error: invalid ampq url: blah';
                expect(err.toString()).to.contain(errString);
                done();
            }).catch(function(err) {
                console.log(err);
                done(err);
            });
     });


      it("invalid amqp url auth", function (done) {

            var amqpConnect = amqp.connect('amqp://bob:password@localhost');

             amqpConnect.then(function (amqpApi) {
                console.log("muon amqpConnect.then() status ok");
            }, function (err) {
                console.log("muon amqpConnect.then() " + err);
                var errString = 'Handshake terminated by server: 403 (ACCESS-REFUSED) with message';
                expect(err.toString()).to.contain(errString);
                done();
            }).catch(function(err) {
                console.log(err);
                done(err);
            });
      });


      it("invalid amqp url host", function (done) {

            var amqpConnect = amqp.connect('amqp://bob:password@lolcathost');

             amqpConnect.then(function (amqpApi) {
                console.log("muon amqpConnect.then() status ok");
            }, function (err) {
                console.log("muon amqpConnect.then() " + err);
                var errString = 'Error: getaddrinfo ENOTFOUND lolcathost lolcathost:5672';
                expect(err.toString()).to.contain(errString);
                done();
            }).catch(function(err) {
                console.log(err);
                done(err);
            });
      });


      it("invalid amqp url port", function (done) {

            var amqpConnect = amqp.connect('amqp://bob:password@localhost:60606');

             amqpConnect.then(function (amqpApi) {
                console.log("muon amqpConnect.then() status ok");
            }, function (err) {
                console.log("muon amqpConnect.then() " + err);
                var errString = 'Error: connect ECONNREFUSED 127.0.0.1:60606';
                expect(err.toString()).to.contain(errString);
                done();
            }).catch(function(err) {
                console.log(err);
                done(err);
            });
      });
});