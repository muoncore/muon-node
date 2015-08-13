
var url = require("url");
var uuid = require("node-uuid");

module.exports = function(queues) {

    //module.serviceIdentifier = serviceIdentifier;
    module.queues = queues;

    var replyQueue = "resource-reply." + uuid.v1();

    var resourceHandlers = {};
    var responseHandlers = {};

    module.queues.listen(replyQueue, function(event) {
        logger.debug("Resource response received: ", event.headers);
        var headers = event.headers;

        //TODO assert that it's JSON!

        var res = headers.RequestID;
        var handler = responseHandlers[res];
        if (typeof(handler) != 'function') {
            logger.warn("Received a response for an unregistered request");
            return;
        }

        try {
            handler(headers, event.payload);
        } catch (err) {
            logger.warn("Unable to correctly parse the response");
            console.dir(err);
            handler(headers, {});
        }
    });

    setupResourceHandler(resourceHandlers);

    return {
        setServiceIdentifier: function(ident) {
            module.serviceIdentifier = ident;
        },
        sendAndWaitForReply: function(event, callback) {
            //get the url elements

            logger.debug('Dispatch resource request on ' + event.url);

            var u = url.parse(event.url, true);
            logger.trace('resource query params: ', u.query);
            var requestId = uuid.v1();

            responseHandlers[requestId] = function(header, payload) {
                callback(header, payload);
            };

            if (typeof event.payload !== 'object') {
                logger.error('event payload is not of type object. Currently muon node can only sent json object types');
                throw ('event payload is not of type object. Currently muon node can only sent json object types');
            }

            var queue = "resource-listen." + u.hostname;

            var head = {
                "Content-Type":"application/json",
                "Accept":"application/json",
                "verb":event.method,
                "RESOURCE":u.pathname,
                "RESPONSE_QUEUE":replyQueue,
                "RequestID": requestId
            };

            var queryParams = {};

            for(var k in u.query) queryParams[k]= u.query[k];

            event.headers = head;
            event.params = queryParams;
            logger.debug('sending event ' + event.headers.RequestID);
            module.queues.send(queue, event);
        },

        listenOnResource: function(resource, method, callback) {
            resource = resource.replace(/^\/|\/$/g, '');
            var key = resource + "-" + method;
            resourceHandlers[key] = callback;
        }
    };
};

function setupResourceHandler(handlers) {
    var waitInterval = setInterval(function () {

        if (typeof module.queues == 'object' && module.serviceIdentifier !== 'undefined') {
            clearInterval(waitInterval);

            var resourceQueueName = 'resource-listen.' + module.serviceIdentifier;

            module.queues.listen(resourceQueueName, function (request, message) {
                var verb = request.headers.verb;
                var resource = request.headers.RESOURCE;
                resource = resource.replace(/^\/|\/$/g, '');
                var key = resource + "-" + verb;
                var responseQueue = request.headers.RESPONSE_QUEUE;
                var requestId = request.headers.RequestID;

                var msg;

                if (message.data != null) {
                    msg = message.data.toString();
                } else if (typeof(message) == "object") {
                    msg = message;
                } else {
                    msg = message.toString();
                }

                try {

                    var payload;
                    if (typeof(message) == "object") {
                        payload = message;
                    } else {
                        payload = JSON.parse(msg);
                    }

                    logger.trace("Received resource request " + key + " on " + responseQueue);
                    logger.trace('listener received request: ', request);
                    logger.trace('listener received message: ', message);

                    var handler = function (request, message, response) {

                        response({
                            "message": "no resource with the name " + resource + " with method " + verb
                        }, {
                            "RequestID": requestId,
                            "Status": "404"
                        })
                    };
                    if (key in handlers && typeof handlers[key] !== 'undefined') {
                        logger.trace("Found " + key + " in registered handlers");
                        handler = handlers[key];
                    }
                    handler({
                        verb: verb,
                        resource: resource,
                        headers: request.headers
                    }, payload, function (response, headers) {
                        if (typeof headers === 'undefined') {
                            headers = {};
                        }
                        headers.RequestID = requestId;
                        if (headers.Status == null) {
                            headers.Status = "200";
                        }
                        module.queues.send(responseQueue, {
                            "headers": headers,
                            "payload": response
                        });
                    });
                } catch (err) {
                    logger.warn("Unable to correctly parse the Request, failing");
                    console.dir(err);
                }
            });
        }
    }, 100);
}
