var muoncore = require('../../muon/api/muoncore.js');
var assert = require('assert');
var expect = require('expect.js');
var messages = require('../../muon/domain/messages.js');
var muon;
var muon2;

describe("event domain test", function () {

    it("create transport error message", function (done) {
          var msg = messages.rpcMessage("PING", 'testclient', 'muon://testserver/ping');
          console.log('valid message: ');
          console.dir(msg);
          assert.equal(msg.payload, 'PING');
          assert.equal(msg.headers.origin_service, 'testclient');
          assert.equal(msg.headers.target_service, 'testserver');
          assert.equal(msg.headers.url, 'muon://testserver/ping');
          done();
    });



});


