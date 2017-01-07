require('mocha-sinon');
var sinon = require("sinon");
var assert = require('assert');
var url = require('url');
var expect = require('expect.js');
var _ = require('underscore');
var Discovery = require("../../muon/discovery/multicast/discovery");
var BaseDiscovery = require("../../muon/discovery/base-discovery");
require('sexylog');

var discovery1;
var discovery2;
var discovery3;

describe("Multicast Discovery: ", function () {

  afterEach(function () {
    discovery1.close();
    discovery2.close();
    if (discovery3) discovery3.close();
    discovery1 = null
    discovery2 = null
    discovery3 = null
  });

  it("Discoveries can locate each other", function (done) {
    this.timeout(12000);

    discovery1 = new BaseDiscovery(new Discovery(), 500)
    discovery2 = new BaseDiscovery(new Discovery(), 500)
    discovery3 = new BaseDiscovery(new Discovery(), 500)

    discovery1.advertiseLocalService({
      identifier: "tombola",
      tags: ["node", "tombola"],
      codecs: ["application/json"],
      connectionUrls: [process.env.MUON_URL || "amqp://muon:microservices@localhost"]
    });

    discovery2.advertiseLocalService({
      identifier: "simple",
      tags: ["node", "simple"],
      codecs: ["application/json"],
      connectionUrls: [process.env.MUON_URL || "amqp://muon:microservices@localhost"]
    });

    discovery3.advertiseLocalService({
      identifier: "awesomeService",
      tags: ["node", "awesomeService"],
      codecs: ["application/json"],
      connectionUrls: [process.env.MUON_URL || "amqp://muon:microservices@localhost"]
    });

    discovery1.discoverServices(function (services) {
      assert.ok(services.find('simple'), 'could not find "simple" service in discovery list (services=)' + JSON.stringify(services) + ')');
      assert.ok(services.find('tombola'), 'could not find "tombola" service in discovery list (services=' + JSON.stringify(services) + ')');
      assert.ok(services.find('awesomeService'), 'could not find "awesomeService" service in discovery list (services=' + JSON.stringify(services) + ')');
      done();
    });
  });
});
