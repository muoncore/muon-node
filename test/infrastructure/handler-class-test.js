var Handler = require('../../muon/infrastructure/handler-class.js');
var assert = require('assert');
var expect = require('expect.js');
require('sexylog');
var bichannel = require('../../muon/infrastructure/channel.js');


describe("Handler class test:", function () {


      this.timeout(4000);


      after(function() {

      });


    it("handler between two channels", function (done) {

            var msg = {count: 0, audit: []};

              var upstream = bichannel.create("upstream");
              var downstream = bichannel.create("downstream");

               var testHandler = new Handler('test');


              // OUTGOING/DOWNSTREAM event handling protocol logic
               testHandler.outgoing(function(message, forward, back) {
                    message.count++;
                    message.audit.push('testHandler.outgoing()');
                    forward(message);
               });

             // OUTGOING/DOWNSTREAM event handling protocol logic
              testHandler.incoming(function(message, forward, back) {
                     message.count++;
                     message.audit.push('testHandler.incoming()');
                     forward(message);
              });

                upstream.rightHandler(testHandler);
                downstream.leftHandler(testHandler);

                upstream.leftSend(msg);


                upstream.leftConnection().listen(function(message) {
                        console.log('***** upstream message returned:');
                        console.dir(message);
                        assert.equal(message.count, 2);
                        assert.equal(message.audit[0], 'testHandler.outgoing()');
                        assert.equal(message.audit[1], 'testHandler.incoming()');
                        done();
                });


                downstream.rightConnection().listen(function(message){
                    downstream.rightSend(message);
                });

    });




});
