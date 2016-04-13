var bichannel = require('../../../muon/infrastructure/channel.js');
var server = require('../../../muon/transport/amqp/server.js');
var assert = require('assert');
var expect = require('expect.js');
var uuid = require('node-uuid');
var messages = require('../../../muon/domain/messages.js');
var AmqpDiscovery = require("../../../muon/discovery/amqp/amqp-discovery");

describe("muon client test", function () {


     beforeEach(function() {
        //
     });

      afterEach(function() {
            //shutdown nicely
      });

     before(function() {

     });

      after(function() {
            //shutdown nicely
      });

    it("server amqp url connection error handled gracefully", function (done) {

        var serverName = 'serverabc123';
        var clientName = 'clientabc123';
        var url = "amqp://";
        var discovery = new AmqpDiscovery(url);

         var fakeServerStackChannel = bichannel.create("fake-serverstacks");
        var fakeServerStacks = {
            openChannel: function() {
                return fakeServerStackChannel.rightConnection();
            }
        }


        server.onError(function(err) {
                   console.log('********** client_server-test.js muonClientChannel.onError() error received: ');
                   console.dir(err);
                   console.log(typeof err);
                   assert.ok(err);
                   assert.ok(err instanceof Error);
                   expect(err.toString()).to.contain('Error: invalid ampq url');
                   done();
        });

        server.connect(clientName, url, fakeServerStacks, discovery);

    });

});