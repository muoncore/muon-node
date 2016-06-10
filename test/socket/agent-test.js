"use strict";

var Agent = require('../../muon/socket/agent.js');
var assert = require('assert');
var expect = require('expect.js');
require('sexylog');
var bichannel = require('../../muon/infrastructure/channel.js');


describe("Agent class test:", function () {

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

                    assert.equal(protocol, message.protocol);
                    assert.equal('keep-alive', message.step);
                      if (keepAlivePingCount == 3) done();
                });

    });

    /**  SEND 10 message (once every 10ms, then wait for keep alive)   */
    it("agent delays keep alive pings if event received", function (done) {

              var upstream = bichannel.create("upstream");
              var downstream = bichannel.create("downstream");
              var protocol = 'rpc';
              var agent = new Agent(upstream, downstream, protocol, 200);

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
                    if (messagesReceived > 10 && pingReceived) done();
                });

    });

    





});
