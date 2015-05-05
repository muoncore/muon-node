
var url = require("url");
var uuid = require("node-uuid");

module.exports = function(queues) {

    //module.serviceIdentifier = serviceIdentifier;
    module.queues = queues;

    var replyQueue = "resource-reply." + uuid.v1();

    var resourceHandlers = {};
    var responseHandlers = {};

    module.queues.listen(replyQueue, function(event) {
        logger.info("Resource response received!");
        var headers = event.headers;

        //TODO assert that it's JSON!

        var res = headers.RequestID;
        var handler = responseHandlers[res];
        if (typeof(handler) != 'function') {
            logger.warn("Received a response for an unregistered request");
            return;
        }

        var payload = JSON.parse(event.payload.data.toString());

        handler(headers, payload);
    });

    setupResourceHandler(resourceHandlers);

    return {
        setServiceIdentifier: function(ident) {
            module.serviceIdentifier = ident;
        },
        sendAndWaitForReply: function(event, callback) {
            //get the url elements

            logger.info('Dispatch resource request on ' + event.url);

            var u = url.parse(event.url, true);
            var requestId = uuid.v1();

            responseHandlers[requestId] = function(header, payload) {
                callback(header, payload);
            };

            var queue = "resource-listen." + u.hostname;

            event.headers = {
                "Content-Type":"application/json",
                "Accept":"application/json",
                "verb":event.method,
                "RESOURCE":u.path,
                "RESPONSE_QUEUE":replyQueue,
                "RequestID": requestId
            };

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

                logger.debug("Received resource request " + key);
                logger.debug("Response requested on " + responseQueue);

                var handler = function(request, message, response) {
                    response({
                        "message":"no resource with the name " + resource + " with method " + verb
                    }, {
                        "RequestID":requestId,
                        "Status":"404"
                    })
                };
                if (key in handlers && typeof handlers[key] !== 'undefined') {
                    logger.trace("Found " + key + " in registered handlers");
                    handler = handlers[key];
                }
                handler({
                    verb:verb,
                    resource:resource
                }, message, function(response, headers) {
                    if (typeof headers === 'undefined') {
                        headers = {};
                    }
                    headers.RequestID=requestId;
                    module.queues.send(responseQueue, {
                        "headers":headers,
                        "payload":response
                    });
                });
            });
        }
    }, 100);
}
