var bichannel = require('../../../muon/infrastructure/channel.js');
var client = require('../../../muon/transport/rabbit/client.js');
var server = require('../../../muon/transport/rabbit/server.js');
var assert = require('assert');
var expect = require('expect.js');
var uuid = require('node-uuid');
var messages = require('../../../muon/domain/messages.js');
var AmqpDiscovery = require("../../../muon/discovery/amqp/amqp-discovery");

describe("muon client test", function () {


    this.timeout(15000);

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

    it("client error handled gracefully", function (done) {

        var serverName = 'serverabc123';
        var clientName = 'clientabc123';
        var url = "amqp://";
        //var discovery = new AmqpDiscovery(url);

        var muonClientChannel = client.connect(serverName, url, '');

        muonClientChannel.onError(function(err){
            console.log('********** client_server-test.js muonClientChannel.onError() error received: ');
            console.dir(err);
            assert.ok(err);
            assert.ok(err instanceof Error);
            done();
        });

        // must have a listener to work
        muonClientChannel.listen(function(msg){

        });

    });


});