
module.exports = function(connection) {

    module.exchange = connection.exchange('');

    return {
        send: function(queueName, event) {
            console.log('Emitting ' + queueName);

            var waitInterval = setInterval(function() {
                if (typeof module.exchange === 'object') {
                    clearInterval(waitInterval);

                    //console.log('Event emitted');
                    console.dir(event);

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
                            console.log("done?");
                        });
                }
            }, 100);
        },
        listen: function(queueName, callback) {

            console.log("Creating listen queue " + queueName);
            connection.queue(queueName, {
                durable: false,
                exclusive: true,
                ack: true,
                autoDelete: true
            }, function (q) {
                q.subscribe(function (message, headers, deliveryInfo, messageObject) {
                    //todo, headers ...
                    console.log("Queue message received");
                    console.log(message);

                    callback({
                        payload: message
                    }, message);
                });
            });
        }
    }
};