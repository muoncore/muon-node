var AmqpQueues = function (connection) {
    this.connection = connection;
    this.exchange = connection.exchange('');
};

AmqpQueues.prototype.setEventLogger = function (eventLogger) {
    this.eventLogger = eventLogger;
};

AmqpQueues.prototype.send = function (queueName, event) {
    var _this = this;
    logger.debug('Emitting event on queue ' + queueName);
    logger.trace('event: ', event);

    if (this.eventLogger != null) {
        this.eventLogger.logEvent(queueName, event);
    }
    //if (typeof event.payload !== 'object') {
    //    logger.error('event payload is not of type object. Currently muon node can only sent json object types');
    //    logger.error('event payload: ' + event.payload);
    //    console.dir(event);
    //    throw ('event payload is not of type object. Currently muon node can only sent json object types');
    //}

    var waitInterval = setInterval(function () {
        if (typeof _this.exchange === 'object') {
            clearInterval(waitInterval);

            var headers = {};
            if (event.headers instanceof Object) {
                headers = event.headers;
            }

            var params = {};
            if (event.params instanceof Object) {
                params = event.params;
            }

            headers.qparams = params;

            var options = {
                headers: headers
            };


            var payload = event.payload;
            //if (typeof payload === 'object' && options.headers['']) {
            //    payload = JSON.stringify(event.payload);
            //}

            if (typeof payload === 'undefined') {
                payload = "";
            }

            logger.trace('message queue payload type: ' + (typeof payload));
            logger.trace('message queue payload: ', payload);
            logger.trace('message queue options: ', options);

            _this.exchange.publish(
                queueName, payload, options, function (resp) {

                });
        }
    }, 100);
};
AmqpQueues.prototype.listen = function (queueName, callback) {

    logger.debug("Creating listen queue " + queueName);
    var _this = this;

    this.connection.queue(queueName, {
        durable: false,
        exclusive: false,
        ack: true,
        autoDelete: true
    }, function (q) {
        q.subscribe(function (message, headers, deliveryInfo, messageObject) {
            //todo, headers ...
            logger.trace("Queue message received on " + queueName, message);

            if (_this.eventLogger != null) {
                _this.eventLogger.logEvent(queueName, message);
            }

            callback({
                "headers": headers,
                "payload": message
            }, message);
        });
    });
};

module.exports = AmqpQueues;
