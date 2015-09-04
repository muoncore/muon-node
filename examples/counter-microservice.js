var _ = require("underscore");
var muonCore = require("../muon.js");
var expect = require('expect.js');
var assert = require('assert');

var counterServer = muonCore.generateMuon();

var counter = 1;

counterServer.onQuery("/next", function(event, data, respond) {
        var next = counter;
        //console.log('counter service running on onQuery("/next"): number:', next);
        counter++;
        respond(next);
});

for (var i = 0 ; i < 100 ; i++) {
    counterServer.query('muon://counter/next', function(event, payload) {
                        console.log('counter client: next id: ', payload);
    });
}

console.log('finished');































