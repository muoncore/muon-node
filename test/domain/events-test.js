var muoncore = require('../../muon/api/muoncore.js');
var assert = require('assert');
var expect = require('expect.js');
var events = require('../../muon/domain/events.js');
var muon;
var muon2;

describe("event domain test", function () {




    it("create rpc event with valid headers", function (done) {

          var event = events.rpcEvent("PING", 'testclient', 'muon://testserver/ping', 'application/json');
          assert.equal(event.payload.data, 'PING');
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




