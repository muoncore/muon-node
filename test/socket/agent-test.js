"use strict";

var Agent = require('../../muon/socket/agent.js');
var assert = require('assert');
var expect = require('expect.js');
require('sexylog');
var bichannel = require('../../muon/infrastructure/channel.js');


describe("Agent class test:", function () {




    it("handler between two channels", function (done) {

            var msg = {text: 'wakey! wakey!'};

              var upstream = bichannel.create("upstream");
              var downstream = bichannel.create("downstream");

              var agent = new Agent(upstream, downstream);

                upstream.leftSend(msg);

                upstream.leftConnection().listen(function(message) {
                        console.log('***** upstream message returned:');
                        console.dir(message);
                        assert.equal(message.text, msg.text);
                        done();
                });


                downstream.rightConnection().listen(function(message){
                    downstream.rightSend(message);
                });

    });






});
