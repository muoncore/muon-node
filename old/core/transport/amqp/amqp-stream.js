var StreamProxyClient = require("./stream/StreamClient.js");
var Rx = require('rx');


var AmqpStream = function (queues) {
    this.queues = queues;
};

AmqpStream.prototype.subscribe = function (streamUri, onData) {

    //TODO, expose the various events coming out of this to the caller somehow.
    //propogate the signals back to the server.

    var stream = new StreamProxyClient(this.queues);

    var batchSize = 10;
    var handled = 0;

    var ob;

    var source = Rx.Observable.create(function (observer) {
        // Note that this is optional, you do not have to return this if you require no cleanup
        ob = observer;
        return function () {
            //console.log('disposed');
        };
    });

    stream.dataReceived.add(function(data) {
        ob.onNext(data);
    });

    //TODO temp auto handling of backpressure protocol. select in small batches.
    stream.dataReceived.add(function () {
        if (++handled >= batchSize) {
            handled = 0;
            stream.requestData(batchSize);
        }
    });

    stream.subscribed.add((function () {
        //TODO,Ideally expose this to the using library as the back pressure signal
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
            ob.onError(event);
            logger.error("Remote stream " + streamUri + " does not exist, NACK received");
        }
    }));
    stream.completed.add((function () {
        ob.onCompleted();
    }));

    stream.subscribe(streamUri);

    return source;

};

module.exports = AmqpStream;
