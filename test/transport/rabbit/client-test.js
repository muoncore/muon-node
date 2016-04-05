var bichannel = require('../../../muon/infrastructure/channel.js');
var client = require('../../../muon/transport/rabbit/client.js');
var server = require('../../../muon/transport/rabbit/server.js');
var assert = require('assert');
var expect = require('expect.js');
var uuid = require('node-uuid');
var messages = require('../../../muon/domain/messages.js');
var errors = require('../../../muon/domain/error-messages.js');
var AmqpDiscovery = require("../../../muon/discovery/amqp/amqp-discovery");

describe("muon client test", function () {


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
        //var discovery = new AmqpDiscovery(url);

        var muonClientChannel = client.connect(serverName, url, '');
/*
        muonClientChannel.onError(function(err){
            console.log('********** client_server-test.js muonClientChannel.onError() error received: ');
            console.dir(err);
            assert.ok(err);
            assert.ok(err instanceof Error);
            done();
        });
*/
        muonClientChannel.listen(function(msg){
            if (errors.isException(msg)) {
                   var err = msg.payload;
                   console.log('********** client_server-test.js muonClientChannel.onError() error received: ');
                   console.dir(err);
                   console.log(typeof err);
                   assert.ok(err);
                   assert.ok(err instanceof Error);
                   expect(err.toString()).to.contain('Error: invalid ampq url');
                   done();
            } else if (errors.isError(msg)) {
                throw new Error('message expected to be an exception error');

            } else {
                throw new Error('message expected to be an exception');
            }

        });

    });

    it("client discovery error handled gracefully", function (done) {

        var serverName = 'serverabc123';
        var clientName = 'clientabc123';
        var url = "amqp://muon:microservices@localhost";
        var discovery = new AmqpDiscovery(url);

        var muonClientChannel = client.connect(serverName, url, discovery);
/*
        muonClientChannel.onError(function(err){
            console.log('********** client_server-test.js muonClientChannel.onError() error received: ');
            console.dir(err);
            console.log(typeof err);
            assert.ok(err);
            assert.ok(err instanceof Error);
            expect(err.toString()).to.contain('unable to find muon service');
            done();
        });

        muonClientChannel.listen(function(msg){

        });
*/

        muonClientChannel.listen(function(msg){
            if (errors.isException(msg)) {
                   var err = msg.payload;
                   console.log('********** client_server-test.js muonClientChannel.onError() error received: ');
                   console.dir(err);
                   console.log(typeof err);
                   assert.ok(err);
                   assert.ok(err instanceof Error);
                   expect(err.toString()).to.contain('unable to find muon service');
                   done();
            } else if (errors.isError(msg)) {
                throw new Error('message expected to be an exception error');

            } else {
                throw new Error('message expected to be exception');
            }

        });



    });


});