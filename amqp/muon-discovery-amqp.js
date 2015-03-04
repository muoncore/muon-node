
var _ = require("underscore");

module.exports = function (scope) {

    var _this = this;
    _this.descriptors = [];

    scope.discoveredServiceList = [];
    scope.discoveredServices = [];

    startAnnouncements(scope, _this);
    console.log("AMQP Discovery becomes ready!");

    this.announceService=function(serviceDescriptor) {
        _this.descriptors.push(serviceDescriptor);
    };
    this.clearAnnouncements = function() {
        _this.descriptors = [];
    };

    this.discoverServices=function(callback) {
        callback(scope.discoveredServiceList);
    };
};

function startAnnouncements(scope, _this) {
    var waitInterval = setInterval(function() {
        console.log("discovery waiting .. " + scope.broadcast);
        if (typeof scope.broadcast !== 'undefined') {
            clearInterval(waitInterval);

            scope.broadcast.listenOnBroadcast("serviceAnnounce", function(event) {
                console.log("Saying");
                var pay = JSON.parse(event.payload.toString());
                if(scope.discoveredServiceList.indexOf(pay.identifier) < 0) {
                    scope.discoveredServiceList.push(pay.identifier);
                    scope.discoveredServices.push(pay);
                }
            });

            _.each(_this.descriptors, function(it) {
                scope.broadcast.emit(
                    {
                        name:"serviceAnnounce",
                        payload:it
                    });
            });

            setInterval(function() {
                console.log("Announcing service!");
                _.each(_this.descriptors, function(it) {
                    scope.broadcast.emit(
                        {
                            name:"serviceAnnounce",
                            payload:it
                        });
                });
            }, 3500);
        }
    }, 100);

}