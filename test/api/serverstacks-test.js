var ServerStacks = require('../../muon/api/server-stacks.js');
var handler = require('../../muon/infrastructure/handler.js');


describe("serverStacks test:", function () {


  it("does server stack things", function (done) {
      var serverStacks = new ServerStacks('test-server');


      var stubProtocol = {

          name: function() {return 'stub'},
          protocolHandler: function() {
            return {
              server: function() {
                var protocolHandler = handler.create('server', {});
                protocolHandler.outgoing(function(data, accept, reject, route) {
                    console.log('server outgoing data: ' + data);
                });
                protocolHandler.incoming(function(data, accept, reject, route) {
                    console.log('server incoming data: ' + data);
                    accept(data);
                });
                return protocolHandler;
              },
              client: function() {
                var protocolHandler = handler.create('client', {});
                protocolHandler.outgoing(function(data, accept, reject, route) {
                    console.log('client outgoing data: ' + data);
                });
                protocolHandler.incoming(function(data, accept, reject, route) {
                    console.log('client incoming data: ' + data);
                });
                return protocolHandler;
              }
            }
          }
      }

      serverStacks.addProtocol(stubProtocol);

      var channel = serverStacks.openChannel('stub');

      channel.send('test message');

      done();
  });

});
