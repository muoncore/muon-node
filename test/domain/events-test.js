var muoncore = require('../../muon/api/muoncore.js');
var assert = require('assert');
var expect = require('expect.js');
var events = require('../../muon/domain/events.js');
var muon;
var muon2;

describe("event domain test", function () {




    it("create rpc event with valid headers", function (done) {

          var event = events.rpcEvent("PING", 'testclient', 'muon://testserver/ping', 'application/json');
          console.log('valid event: ');
          console.dir(event);
          assert.equal(event.payload.data, 'PING');
          done();
    });

    /*



    */

    it("test event validation", function (done) {
          var event =     {
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

          var response = events.validate(event);
          assert(response);
          done();
    });


    it("create invalid event with headers and thrown exception", function (done) {
          try {
            event = events.rpcEvent("PING", 'testclient', '', '');
          }
          catch(err) {
            expect(err).not.to.be(undefined);
            expect(err.message).to.contain('problem validating rpc event schema');
          }
          done();
    });


});




