var muoncore = require('../../muon/api/muoncore.js');
var assert = require('assert');
var expect = require('expect.js');
var messages = require('../../muon/domain/messages.js');
var muon;
var muon2;

describe("event domain test", function () {




    it("create rpc message with valid headers", function (done) {

          var msg = messages.rpcMessage("PING", 'testclient', 'muon://testserver/ping', 'application/json');
          console.log('valid message: ');
          console.dir(msg);
          assert.equal(msg.payload.data, 'PING');
          done();
    });

    /*



    */

    it("test message validation", function (done) {
          var msg =     {
                id: '696f4064-2cc5-44c2-a4dd-6c61bdb1e799',
                created: new Date(),
                headers:
                 { id: '696f4064-2cc5-44c2-a4dd-6c61bdb1e799',
                   eventType: 'RequestMade',
                   protocol: 'request',
                   targetService: 'server1',
                   sourceService: 'client1',
                   url: 'muon://server1/ping',
                   channelOperation: 'NORMAL',
                   'Content-Type': 'application/json',
                   sourceAvailableContentTypes: [ 'application/json' ] },
                payload: { data: 'PING' }
          };

          var response = messages.validate(msg);
          assert(response);
          done();
    });


    it("create invalid message with headers and thrown exception", function (done) {
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




