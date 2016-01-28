var bichannel = require('../../muon/infrastructure/channel.js');
var handler = require('../../muon/infrastructure/handler.js');
var assert = require('assert');
require('sexylog');
var csp = require("js-csp");

describe("Bi directional channel test", function () {

    this.timeout(4000);


      after(function() {
            //bi-channel.closeAll();
      });

    it("channel sends and receives messages via callbacks", function (done) {

         var client1 = function(connection) {
            connection.send("sent by client 1");
            connection.listen(function(response) {
                    assert.equal(response, "sent by client 2");
                    done();
            });
         };

         var client2 = function(connection) {
            connection.listen(function(response) {
                     connection.send("sent by client 2");
            });
         }

         var channel = bichannel.create("test-channel-1");
         console.log("channel: " + JSON.stringify(channel));
         client1(channel.leftConnection());
         client2(channel.rightConnection());

    });


    it("channel sends and receives messages via go synchronous looking calls", function (done) {

         var client1 = function(connection) {
            connection.send("sent by client 1");

            csp.go(function*() {
              var response = yield csp.take(connection.listen());
               assert.equal(response, "sent by client 2");
               done();
            });
         }

         var client2 = function(connection) {
                csp.go(function*() {
                  var response = yield csp.take(connection.listen());
                   assert.equal(response, "sent by client 1");
                   connection.send("sent by client 2");
                });
         }

         var channel = bichannel.create("test-channel-2");
         client1(channel.leftConnection());
         client2(channel.rightConnection());

    });

    it("compose two channels joined via handler", function (done) {

         var reqResHandler = handler.create();
         reqResHandler.outgoing(function(event){
                if (! event) {
                    throw new Error('reqResHandler: event is null');
                }
                return event;
         });
         reqResHandler.incoming(function(event){
                 if (! event) {
                     throw new Error('reqResHandler: event is null');
                 }
                 return event;
          });



         var channelA = bichannel.create("test3A");
         var channelB = bichannel.create("test3B");

         channelA.rightHandler(reqResHandler);
         channelB.leftHandler(reqResHandler);


         var event = {id: 3, payload: "test payload 3"};

         channelA.leftConnection().listen(function(e) {
                assert(e.payload == event.payload);
                done();
         });

         channelB.rightConnection().listen(function(e) {
            channelB.rightConnection().send(e);
         });

         channelA.leftConnection().send(event);
    });


    it("null event triggers handler to throw error", function (done) {

         var reqResHandler = handler.create();
         reqResHandler.outgoing(function(event){
                if (! event.id) {
                    throw new Error('reqResHandler: event is null');
                }
                return event;
         });
         reqResHandler.incoming(function(event){
                 if (! event.id) {
                     throw new Error('reqResHandler: event is null');
                 }
                 return event;
          });



         var channelA = bichannel.create("test3A");
         var channelB = bichannel.create("test3B");

         channelA.rightHandler(reqResHandler);
         channelB.leftHandler(reqResHandler);

         channelA.leftConnection().listen(function(e) {
                assert(e.status == 'error');
                done();
         });

         var event = {};
         channelA.leftConnection().send(event);
    });
});


