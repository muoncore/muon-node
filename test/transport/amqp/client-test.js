var bichannel = require('../../../muon/infrastructure/channel.js');
var client = require('../../../muon/transport/amqp/client.js');
var server = require('../../../muon/transport/amqp/server.js');
var assert = require('assert');
var expect = require('expect.js');
var uuid = require('node-uuid');
var messages = require('../../../muon/domain/messages.js');

var AmqpDiscovery = require("../../../muon/discovery/amqp/discovery");

describe("client test:", function () {


    this.timeout(20000);

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

    it("client url error handled gracefully", function (done) {

        var serverName = 'serverabc123';
        var clientName = 'clientabc123';
        var url = "amqp://";
        var discovery = new AmqpDiscovery(url);


        client.onError(function(err) {
                   console.log('********** client_server-test.js muonClientChannel.onError() error received: ');
                   console.dir(err);
                   console.log(typeof err);
                   assert.ok(err);
                   assert.ok(err instanceof Error);
                   expect(err.toString()).to.contain('Error: invalid ampq url');
                   done();
        });

        var muonClientChannel = client.connect(serverName, 'rpc', url, discovery);

        muonClientChannel.listen(function(msg){   });

    });

    it("client discovery error handled gracefully", function (done) {

        var serverName = 'serverabc123';
        var clientName = 'clientabc123';
        var url = "amqp://muon:microservices@localhost";
        var discovery = new AmqpDiscovery(url);

        var muonClientChannel = client.connect(serverName, 'rpc', url, discovery);


        muonClientChannel.listen(function(msg){
                 expect(msg.status).to.contain('failure');
                 var payload = messages.decode(msg.payload);
                 expect(payload.status).to.contain('noserver');
                 done();
        });



    });


});
