var bichannel = require('../../muon/infrastructure/channel');
var assert = require('assert');
var csp = require("js-csp");

describe("Bi directional csp channel test", function () {

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
         }

         var client2 = function(connection) {
            connection.listen(function(response) {
                     connection.send("sent by client 2");
            });
         }

         var channel = bichannel.create("test-channel");
         client1(channel.left());
         client2(channel.right());

    });


    it("channel sends and receives messages via synchronous looking calls", function (done) {

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

         var channel = bichannel.create("test-channel");
         client1(channel.left());
         client2(channel.right());

    });
});




