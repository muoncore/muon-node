
module.exports = function(connection) {

    var exchange;

    return {
        emit: function(event) {
            //console.log('Emitting event');

            var waitInterval = setInterval(function() {

                if (typeof _this.broadcastExchange === 'object') {

                    clearInterval(waitInterval);

                    //console.log('Event emitted');
                    //console.dir(event);

                    var headers = {};
                    if (event.headers instanceof Object) {
                        headers = event.headers;
                    }

                    var options = {
                        headers: headers
                    };

                    var exch = _this.broadcastExchange;
                    exch.publish(
                        event.name,
                        JSON.stringify(event.payload), options, function (resp) {
                            //wat do
                        });
                } else {

                }

            }, 100);
        },
        listenOnBroadcast: function(event, callback) {
            var waitInterval = setInterval(function() {
                if(typeof _this.broadcastExchange == 'object') {
                    clearInterval(waitInterval);
                    var queue = "muon-node-broadcastlisten-" + uuid.v1();

                    console.log("Creating broadcast listen queue " + queue);

                    _this.queue.connection.queue(queue, {
                        durable: false,
                        exclusive: true,
                        ack: true,
                        autoDelete: true
                    }, function (q) {
                        q.bind("muon-broadcast", event, function () {
                            console.log("Bound event queue " + queue);
                            q.subscribe(function (message, headers, deliveryInfo, messageObject) {
                                //todo, headers ...
                                //console.log("Broadcast received");
                                //console.log(message.data.toString());

                                callback({
                                    payload: message.data
                                }, message.data);


                            });
                        });


                    });


                }
            }, 100);
        }
    }
};