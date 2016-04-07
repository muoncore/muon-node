var muoncore = require('../../muon/api/muoncore.js');
var assert = require('assert');
var expect = require('expect.js');
var messages = require('../../muon/domain/messages.js');


describe("test messages:", function () {


    it("create muon message with valid headers", function (done) {
           //todo change to muon message
          var msg = messages.rpcMessage("PING", 'testclient', 'muon://testserver/ping');
          console.log('valid message: ');
          console.dir(msg);
          assert.equal(msg.payload, 'PING');
          assert.equal(msg.headers.origin_service, 'testclient');
          assert.equal(msg.headers.target_service, 'testserver');
          assert.equal(msg.headers.url, 'muon://testserver/ping');
          done();
    });




    it("copy message", function (done) {
          var msg =  messages.rpcMessage("PING", 'testclient', 'muon://testserver/ping');
          var messageCopy = messages.copy(msg);
          assert.deepEqual(msg, messageCopy);
          done();
    });




    it("test message validation", function (done) {
          var msg =     {
                id: '696f4064-2cc5-44c2-a4dd-6c61bdb1e799',
                created: new Date(),
                headers:
                 { origin_id: '696f4064-2cc5-44c2-a4dd-6c61bdb1e799',
                   event_type: 'request.made',
                   protocol: 'request',
                   event_source: arguments.callee.caller.name,
                   target_service: 'server1',
                   origin_service: 'client1',
                   url: 'muon://server1/ping',
                   channel_op: 'normal',
                   content_type: 'application/json',
                   content_types: [ 'application/json' ] },
                payload: 'PING'
          };

          var response = messages.validate(msg);
          assert(response);
          done();
    });


    it("creating message with invalid headers throws exception", function (done) {
          try {
            var msg = messages.rpcMessage("PING", 'testclient', '', '');
          }
          catch(err) {
            //logger.error(err);
            //logger.error(err.stack);
            expect(err).not.to.be(undefined);
            expect(err.message).to.contain('Error! problem validating rpc message schema');
          }
          done();
    });


});

