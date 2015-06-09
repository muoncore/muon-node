
var StreamProxyClient = require("./stream/StreamClient.js");

module.exports = function(queues) {

    return {
            provideStream: function(streamName, stream) {


            },
            subscribe: function(streamUri, onData) {

                //TODO, expose the various events coming out of this to the caller somehow.
                //propogate the signals back to the server.

                var stream = new StreamProxyClient(queues);

                stream.dataReceived.add(onData);

                stream.subscribed.add((function() {
                    //TODO,Ideally expose this to the using library as the back pressure signal, but that needs more work ...
                    stream.requestData(100);
                }));
                stream.errored.add((function(event) {
                    logger.error("An error occurred in the stream");
                    console.dir(event);

                    if (event.headers.command != "SUBSCRIPTION_NACK") {
                        setTimeout(function() {
                            stream.subscribe(streamUri);
                        }, 100);
                    } else {
                        logger.error("Remote stream " + streamUri + " does not exist, NACK received");
                    }
                }));
                stream.completed.add((function() {
                    console.log("THE AMQP STREAM IS COMPLETED!!!!")
                }));

                stream.subscribe(streamUri);
        }
    }
};
