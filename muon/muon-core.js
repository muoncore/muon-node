
var uuid = require('node-uuid');

module.exports = function(serviceIdentifier) {

    module.transports = [];
    module.serviceIdentifier = serviceIdentifier;

    return {
        addTransport: function (transport) {
            //todo, verify the transport.
            //var transport = module.transports[0];
            transport.setServiceIdentifier(serviceIdentifier);
            module.transports.push(transport);
        },
        onBroadcast: function (event, callback) {
            _listenOnBroadcast(event, callback);
        },
        onGet: function (resource, doc, callback) {
            _listenOnResource(resource, "get", callback);
        },
        onPost: function (resource, doc, callback) {
            _listenOnResource(resource, "post", callback);
        },
        onPut: function (resource, doc, callback) {
            _listenOnResource(resource, "put", callback);
        },
        onDelete: function (resource, doc, callback) {
            _listenOnResource(resource, "delete", callback);
        },
        get: function (url, callback) {
            _sendAndWaitForReply({
                url: url,
                payload: {},
                method: "get"
            }, callback);
        },
        put: function (url, payload, callback) {
            _sendAndWaitForReply({
                url: url,
                payload: payload,
                method: "put"
            }, callback);
        },
        post: function (url, payload, callback) {
            _sendAndWaitForReply({
                url: url,
                payload: payload,
                method: "post"
            }, callback);
        },
        del: function (url, payload, callback) {

            _sendAndWaitForReply({
                url: url,
                payload: payload,
                method: "delete"
            }, callback);
        },

        /**
         * Send a message to a queue
         * @param payload
         * @param queue an object containing queue and optional routing key
         * @param callback
         */

        sendToQueue: function(payload, queue, callback) {

        },

        /**
         * Send a message to a queue and listen for a reply
         * @param payload
         * @param queue
         * @param callback
         */
        sentToQueueAndListen: function(payload, queue, callback) {

        },

        /**
         *
         * @param queue an object containing queue and optional routing key
         * @param callback
         */

        listenOnQueue: function(queue, callback) {

        },

        /**
         * TODO does this need a callback?
         * @param eventName
         * @param headers
         * @param payload
         */
        emit: function (eventName, headers, payload) {
            //var transport = module.transports[0];
            _emit({
                name: eventName,
                headers: headers,
                payload: payload
            });
        },

        broadcast: function(eventName, headers, payload) {
            this.emit(eventName, headers, payload);
        },

        discoverServices: function (callback) {
            //todo, fork, join style on the various transports in parallel.
            var transport = module.transports[0];
            transport.discoverServices(callback);
        }


    };

    /*
    These do practically all the same thing?
     */

    function _listenOnBroadcast(event, callback) {
        var transports = module.transports;

        for(var i=0; i<transports.length; i++) {
            var transport = transports[i];
            transport.listenOnBroadcast(event, callback);
        }

    }

    function _emit(payload) {
        var transports = module.transports;

        for(var i=0; i<transports.length; i++) {
            var transport = transports[i];
            transport.emit(payload);
        }
    }

    function _listenOnResource(resource, method, callback) {
        var transports = module.transports;
        for(var i=0; i<transports.length; i++) {
            var transport = transports[i];
            transport.listenOnResource(resource, method, callback);
        }
    }

    function _sendAndWaitForReply(payload, callback) {
        var transports = module.transports;
        for(var i=0; i<transports.length; i++) {
            var transport = transports[i];
            transport.sendAndWaitForReply(payload, callback);
        }
    }

    function _discoverServices() {
        var transports = module.transports;
        for(var i=0; i<transports.length; i++) {
            var transport = transports[i];
            transport.discoverServices();
        }
    }


};
