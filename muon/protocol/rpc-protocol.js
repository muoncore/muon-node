var handler = require('../infrastructure/handler.js');


exports.newHandler = function() {
         var rpcProtocolHandler = handler.create();

        // OUTGOING/DOWNSTREAM event handling protocol logic
         rpcProtocolHandler.outgoing(function(event) {
             console.dir(event);
                logger.info("[*** PROTOCOL ***] rpc protocol outgoing event id=" + event.headers.id);
                return event;
         });

         // INCOMING/UPSTREAM  event handling protocol logic
         rpcProtocolHandler.incoming(function(event) {
             console.dir(event);
                logger.info("[*** PROTOCOL ***] rpc protocol incoming event id=" + event.headers.id);
                return event;
         });
         //logger.trace('**** rpc proto: '+JSON.stringify(rpcProtocolHandler));
         return rpcProtocolHandler;


}