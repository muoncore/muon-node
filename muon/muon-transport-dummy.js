module.exports = exports = function dummyTransport () {


    var _this = this;

    console.log("Initialising dummy transport");



    var scope = {

        setServiceIdentifier: function (serviceIdentifier) {
            module.serviceIdentifier = serviceIdentifier;
            console.log("Setting service identifier");

        },


        emit: function (event) {
            console.log('Pretending to emit something');
            console.dir(event);
        },

        sendAndWaitForReply: function (event, callback) {
            console.log('Pretending to send something');
            callback({data:'{"nothing ventured": "nothing gained"}'});
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