var assert = require('assert');

var MuonConfig = require("../core/muon-config.js");


it('check that projection-keys query to eventstore returns array of keys', function(done) {
  this.timeout(15000);

  var muonSystem = new MuonConfig().generateMuon();

  muonSystem.resource.query('muon://photon/projection-keys', function(event, payload) {
    console.log(event);
    console.log(payload);
    var keys = payload.data['projection-keys'];
    assert(Array.isArray(keys));

    done();
  });

});
