var muoncore = require('../../muon/api/muoncore.js');
var assert = require('assert');
var expect = require('expect.js');
var messages = require('../../muon/domain/messages.js');


describe("test messages:", function () {


    it("create muon message with valid headers", function (done) {
           //todo change to muon message
          var msg = messages.muonMessage("PING", 'testclient', 'muon://testserver/ping');
          console.log('valid message: ');
          console.dir(msg);
          assert.equal(msg.payload, 'PING');
          assert.equal(msg.origin_service, 'testclient');
          assert.equal(msg.target_service, 'testserver');
          assert.equal(msg.url, 'muon://testserver/ping');
          done();
    });




    it("copy message", function (done) {
          var msg =  messages.muonMessage("PING", 'testclient', 'muon://testserver/ping');
          var messageCopy = messages.copy(msg);
          assert.deepEqual(msg, messageCopy);
          done();
    });


    it("create resource 404 failure message", function (done) {
          var msg =  messages.muonMessage("PING", 'testclient', 'request://testserver/ping');
          var returnMessage = messages.serverFailure(msg, 'request', '404', 'resource not found /ping');
          //console.log('***** messages-test.js ********************************');
          //console.dir(returnMessage);
          assert.equal(returnMessage.origin_service, 'testserver', 'expected return message to swap source/target service');
          assert.equal(returnMessage.target_service, 'testclient', 'expected return message to swap target/source service');
          assert.equal(returnMessage.status, 'failure', 'expected return message to have 404 status');
          assert.equal(returnMessage.payload.status, '404', 'expected return message to have 404 status');
          assert.equal(returnMessage.provenance_id, msg.id, 'expected return message provenance_id to have same msg.id');
          assert.equal(returnMessage.url, 'request://testclient/', 'expected return message url to be substituted');
          done();
    });

    it("create server discovery failure message", function (done) {
          var msg =  messages.muonMessage("PING", 'testclient', 'request://testserver/ping');
          var returnMessage =  messages.clientFailure(msg, 'request', 'noserver', 'service "testserver" not found ');
          //console.log('***** messages-test.js ********************************');
          //console.dir(returnMessage);
          assert.equal(returnMessage.origin_service, 'testclient', 'expected return message to swap source/target service');
          assert.equal(returnMessage.target_service, 'testserver', 'expected return message to swap target/source service');
          assert.equal(returnMessage.status, 'failure', 'expected return message to have 404 status');
          assert.equal(returnMessage.payload.status, 'noserver', 'expected return message to have 404 status');
          assert.equal(returnMessage.provenance_id, msg.id, 'expected return message provenance_id to have same msg.id');
          assert.equal(returnMessage.url, 'request://testserver/ping', 'expected return message url to be substituted');
          done();
    });




    it("test message validation", function (done) {
          var msg =     {
                id: '696f4064-2cc5-44c2-a4dd-6c61bdb1e799',
                created: new Date(),
                provenance_id: '696f4064-2cc5-44c2-a4dd-6c61bdb1e799',
                step: 'request.made',
                protocol: 'request',
                event_source: arguments.callee.caller.name,
                target_service: 'server1',
                origin_service: 'client1',
                url: 'muon://server1/ping',
                channel_op: 'normal',
                content_type: 'application/json',
                payload: 'PING'
          };

          var response = messages.validate(msg);
          assert(response);
          done();
    });


    it("creating message with invalid headers throws exception", function (done) {
          try {
            var msg = messages.muonMessage("PING", 'testclient', '', '');
          }
          catch(err) {
            //logger.error(err);
            //logger.error(err.stack);
            expect(err).not.to.be(undefined);
            expect(err.message).to.contain('Error! problem validating muon message schema');
          }
          done();
    });


});

