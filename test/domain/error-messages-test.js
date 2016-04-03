var assert = require('assert');
var expect = require('expect.js');
var errors = require('../../muon/domain/error-messages.js');
var messages = require('../../muon/domain/messages.js');


describe("event domain test", function () {

    it("create transport error message", function (done) {
          var originalMsg = messages.rpcMessage('PING', 'testclient', 'muon://testserver/ping');
          var error = new Error('muon 404');
          var source = 'transport';
          var errMsg = errors.create('exception', error, originalMsg, source);
          console.log('error message: ');
          console.dir(errMsg);
          assert.equal(errMsg.payload, error);
          assert.equal(errMsg.headers.event_source, source);
          assert.equal(errMsg.headers.event_type, 'error.exception');
          done();
    });



});


