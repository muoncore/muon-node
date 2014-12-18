
var uuid = require('node-uuid');
var restify = require('restify');

module.exports = exports = function httpTransport () {

    var scope =  {

        setServiceIdentifier: function (serviceIdentifier) {
            module.serviceIdentifier = serviceIdentifier;
            console.log("Setting service identifier.");
        },

        emit: function (event) {

        },
        sendAndWaitForReply: function (event, callback) {

        },
        listenOnBroadcast: function (event, callback) {

        },
        listenOnResource: function (resource, method, callback) {

        },
        discoverServices: function (callback) {

        }
    };

    return scope;
};
