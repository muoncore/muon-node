var Handler = require('../../muon/infrastructure/handler-class.js');
var assert = require('assert');
var expect = require('expect.js');
require('sexylog');


describe("Handler class test:", function () {




      after(function() {

      });

    it("new handler", function () {
      var handler = new Handler();
      handler.incoming();
      handler.outgoing();
    });




});
