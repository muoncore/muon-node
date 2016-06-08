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

              var agent = new Agent(upstream, downstream, 'rpc', 100);

                var keepAlivePingCount = 0;
                downstream.rightConnection().listen(function(message){
                    keepAlivePingCount++;
                    if (keepAlivePingCount == 3) done();
                });

    });





});
