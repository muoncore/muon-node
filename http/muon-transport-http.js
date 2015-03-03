
var uuid = require('node-uuid');
var restify = require('restify');

module.exports = exports = function httpTransport () {

    var _this = this;

    this.server = restify.createServer();

    this.server.listen('8080', function() {
        startAnnouncements();
    });


    this.callByMethod = function (method, payload) {

    };

    function startAnnouncements() {
        scope.listenOnBroadcast("serviceAnnounce", function(event) {
            var pay = JSON.parse(event.payload.toString());
            if(_this.discoveredServiceList.indexOf(pay.identifier) < 0) {
                _this.discoveredServiceList.push(pay.identifier);
                _this.discoveredServices.push(pay);
            }
        });

        scope.emit({
            name:"serviceAnnounce",
            payload:{
                identifier: _this.serviceIdentifier
            }
        });

        setInterval(function() {
            scope.emit({
                name:"serviceAnnounce",
                payload:{
                    identifier: _this.serviceIdentifier
                }
            });
        }, 3500);
    }


    var scope =  {

        setServiceIdentifier: function (serviceIdentifier) {
            _this.serviceIdentifier = serviceIdentifier;

        },

        emit: function (event) {
            console.log("Emitting event " + event.name);
            //console.dir(event);
        },
        sendAndWaitForReply: function (event, callback) {

        },
        listenOnBroadcast: function (event, callback) {

            console.log('listen on broadcast');


        },
        listenOnResource: function (resource, method, callback) {

        },
        discoverServices: function (callback) {

        }
    };

    return scope;
};
