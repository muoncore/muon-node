
module.exports = function(connection) {

    module.exchange = connection.exchange('');

    return {
        send: function(queueName, event) {
            logger.debug('Emitting event on queue ' + queueName);

            var waitInterval = setInterval(function() {
                if (typeof module.exchange === 'object') {
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

                    logger.debug('event options: ', options);

                    var payload = JSON.stringify(event.payload);
                    if (typeof payload === 'undefined') {
                        payload = "";
                    }

                    module.exchange.publish(
                        queueName, payload, options, function (resp) {

                        });
                }
            }, 100);
        },
        listen: function(queueName, callback) {

            logger.debug("Creating listen queue " + queueName);
            connection.queue(queueName, {
                durable: false,
                exclusive: false,
                ack: true,
                autoDelete: true
            }, function (q) {
                q.subscribe(function (message, headers, deliveryInfo, messageObject) {
                    //todo, headers ...
                    logger.trace("Queue message received on " + queueName, message);

                    callback({
                        "headers":headers,
                        "payload": message
                    }, message);
                });
            });
        }
    }
};