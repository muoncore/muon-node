var assert = require('assert');
var muonCore = require("../index.js");

it('check that projection-keys query to eventstore returns array of keys', function(done) {
  this.timeout(15000);

  var amqp = muonCore.amqpTransport('amqp://muon:microservices@localhost:5672');

  //Define muon instance for the communications to use
  var muonSystem = muonCore.muon('node-service', amqp.getDiscovery(), [
      ["my-tag", "tck-service", "node-service"]
  ]);

  //Connect transport stream to the instance
  muonSystem.addTransport(amqp);

  muonSystem.resource.query('muon://photon/projection-keys', function(event, payload) {
    console.log(event);
    console.log(payload);
    var keys = payload.data['projection-keys'];
    assert(Array.isArray(keys));

    done();
  });

});
