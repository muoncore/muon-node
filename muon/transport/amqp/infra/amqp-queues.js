var AmqpQueues = function (connection) {
    this.connection = connection;
    this.exchange = connection.exchange('');
};

AmqpQueues.prototype.send = function (queueName, event) {
    var _this = this;
    logger.debug('Emitting event on queue ' + queueName);
    logger.trace('event: ', event);

    var waitInterval = setInterval(function () {
        if (typeof _this.exchange === 'object') {
            clearInterval(waitInterval);

            var headers = {};
            if (event.headers instanceof Object) {
                headers = event.headers;
            }

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

            logger.debug('message queue payload type: ' + (typeof payload));
            logger.debug('message queue payload: ', payload);
            logger.debug('message queue options: ', options);

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
                var logEvent = {
                    headers: headers,
                    payload:message
                };
                _this.eventLogger.logEvent(queueName, logEvent);
            }

            callback({
                "headers": headers,
                "payload": message
            }, message);
        });
    });
};

module.exports = AmqpQueues;
