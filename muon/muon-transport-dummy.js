module.exports = exports = new dummyTransport();

function dummyTransport () {


    var _this = this;



    var scope = {

        setServiceIdentifier: function (serviceIdentifier) {
            module.serviceIdentifier = serviceIdentifier;
            console.log("Setting service identifier");

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
    }

    return scope;
};