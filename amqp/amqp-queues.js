
module.exports = function(connection) {

    module.exchange = connection.exchange('');

    return {
        send: function(queueName, event) {
            logger.trace('Emitting event on ' + queueName, event);

            var waitInterval = setInterval(function() {
                if (typeof module.exchange === 'object') {
                    clearInterval(waitInterval);

                    var headers = {};
                    if (event.headers instanceof Object) {
                        headers = event.headers;
                    }

                    var options = {
                        headers: headers
                    };

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
                exclusive: true,
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