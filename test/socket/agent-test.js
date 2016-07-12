"use strict";

var Agent = require('../../muon/socket/agent.js');
var assert = require('assert');
var expect = require('expect.js');
require('sexylog');
var bichannel = require('../../muon/infrastructure/channel.js');


describe("Agent class test:", function () {

      this.timeout(3000);

    it("agent acts as handler between two channels", function (done) {

            var msg = {text: 'agent smith'};

              var upstream = bichannel.create("upstream");
              var downstream = bichannel.create("downstream");

              var agent = new Agent(upstream, downstream, 'rpc');

                upstream.leftSend(msg);

                upstream.leftConnection().listen(function(message) {
                        console.log('***** upstream message returned:');
                        console.dir(message);
                        assert.equal(msg.text, message.text);
                        done();
                });


                downstream.rightConnection().listen(function(message){
                    downstream.rightSend(message);
                });

    });

    it("agent sends keep alive pings", function (done) {

              var upstream = bichannel.create("upstream");
              var downstream = bichannel.create("downstream");
              var protocol = 'rpc';
              var agent = new Agent(upstream, downstream, protocol, 10);

                var keepAlivePingCount = 0;
                downstream.rightConnection().listen(function(message){
                    keepAlivePingCount++;

                    //assert.equal(protocol, message.protocol);
                      if (keepAlivePingCount == 3) done();
                });

    });


    it("agent delays keep alive pings if event received", function (done) {
              var doneOnce = asyncAssert(done);
              var upstream = bichannel.create("upstream");
              var downstream = bichannel.create("downstream");
              var protocol = 'rpc';
              var agent = new Agent(upstream, downstream, protocol, 200);


              //  SEND 10 message (once every 10ms, then wait for keep alive)  /
              var messagesSent = 0;
              var backgroundSender = setInterval(function() {
                upstream.leftConnection().send({text: 'this is a test event!'});
                messagesSent++;
                if (messagesSent == 10) {
                  clearInterval(backgroundSender);
                }
              }, 10);

                var pingReceived = false;
                var messagesReceived = 0;
                downstream.rightConnection().listen(function(message){
                    //console.log('******************** message: ', message);
                    messagesReceived++;
                    if (message.step == 'keep-alive') pingReceived = true;
                    if (message.text) assert.equal('this is a test event!', message.text);
                    doneOnce(messagesReceived > 10 && pingReceived);
                });

    });

    it("two agents keep each other alive", function (done) {
      var doneOnce = asyncAssert(done);
      var protocol = 'rpc';
      var clientUpstream = bichannel.create("client-upstream");
      var clientDownstream = bichannel.create("client-downstream");
      var serverUpstream = bichannel.create("server-upstream");
      var serverDownstream = bichannel.create("server-downstream");

      function MockTransport(clientConnection, serverConnection) {
          var clientKeepAliveMessages = 0;
          var serverKeepAliveMessages = 0;
          clientConnection.listen(function(msg) {
              logger.info('mock trasnport client listener:' + JSON.stringify(msg));
              clientKeepAliveMessages++;
              serverConnection.send(msg);
          });
          serverConnection.listen(function(msg) {
              logger.info('mock trasnport server listener:' + JSON.stringify(msg));
              serverKeepAliveMessages++;
              clientConnection.send(msg);

              doneOnce(serverKeepAliveMessages > 10 && clientKeepAliveMessages > 10);
          });
      };

      var protocol = 'rpc';
      var clintAgent = new Agent(clientUpstream, clientDownstream, protocol, 10);
      var serverAgent = new Agent(serverUpstream, serverDownstream, protocol, 10);
      var mockTransport = new MockTransport(clientDownstream.rightConnection(), serverDownstream.rightConnection());

    });


    it("agent with no service keep alive shuts down channels", function (done) {
      var doneOnce = asyncAssert(done);

      var upstream = bichannel.create("upstream");
      var downstream = bichannel.create("downstream");
      var protocol = 'rpc';
      var agent = new Agent(upstream, downstream, protocol, 100);

        var keepAlivePingCount = 0;
        var shutdownMessage = 0;
        downstream.rightConnection().listen(function(message){
            logger.debug(JSON.stringify(message));
            if (message.step == 'keep-alive') keepAlivePingCount++;
            if (message.channel_op == 'closed') shutdownMessage++;
            logger.trace('keep-alive='+ keepAlivePingCount + ' closed=' + shutdownMessage);
            doneOnce(keepAlivePingCount >= 3 && shutdownMessage == 1);
        });

    });

});


function asyncAssert(done) {
  var calledDone = false;
  function callDoneOnce() {
      if (calledDone) return;
      calledDone = true;
      done();
  }
  // returns a function that will only call ldone() once which can happen in async tests
  return function(bool) {
    //console.log('doneonce(bool=' + bool + ')');
    if (bool) {
      callDoneOnce();
    }
  }
}
