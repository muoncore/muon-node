var StreamProxyClient = require("./stream/StreamClient.js");

var AmqpStream = function (queues) {
    this.queues = queues;
};

AmqpStream.prototype.subscribe = function (streamUri, onData) {

    //TODO, expose the various events coming out of this to the caller somehow.
    //propogate the signals back to the server.

    var stream = new StreamProxyClient(this.queues);

    var batchSize = 10;
    var handled = 0;

    stream.dataReceived.add(onData);
    stream.dataReceived.add(function () {
        if (++handled >= batchSize) {
            handled = 0;
            stream.requestData(batchSize);
        }
    });

    stream.subscribed.add((function () {
        //TODO,Ideally expose this to the using library as the back pressure signal, but that needs more work ...
        stream.requestData(batchSize);
    }));
    stream.errored.add((function (event) {
        logger.error("An error occurred in the stream");
        console.log(JSON.stringify(event));

        if (event.headers.command != "SUBSCRIPTION_NACK") {
            setTimeout(function () {
                stream.subscribe(streamUri);
            }, 100);
        } else {
            logger.error("Remote stream " + streamUri + " does not exist, NACK received");
        }
    }));
    stream.completed.add((function () {
        console.log("THE AMQP STREAM IS COMPLETED!!!!")
    }));

    stream.subscribe(streamUri);
};

module.exports = AmqpStream;
