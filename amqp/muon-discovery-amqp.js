
var _ = require("underscore");

module.exports = function (scope) {

    var _this = this;
    _this.descriptors = [];

    scope.discoveredServiceList = [];
    scope.discoveredServices = [];

    startAnnouncements(scope, _this);
    logger.debug("AMQP Discovery becomes ready!");

    this.announceService=function(serviceDescriptor) {
        _this.descriptors.push(serviceDescriptor);
    };
    this.clearAnnouncements = function() {
        _this.descriptors = [];
    };

    this.discoverServices=function(callback) {
        callback(scope.discoveredServices);
    };
};

function startAnnouncements(scope, _this) {
    var waitInterval = setInterval(function() {
        logger.debug("discovery waiting .. " + scope.broadcast);
        if (typeof scope.broadcast !== 'undefined') {
            clearInterval(waitInterval);

            scope.broadcast.listenOnBroadcast("serviceAnnounce", function(event) {
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
                var announce = {
                    name:"serviceAnnounce",
                    payload:it
                };
                logger.trace("Announcing service", announce);
                _.each(_this.descriptors, function(it) {
                    scope.broadcast.emit(announce);
                });
            }, 3500);
        }
    }, 100);

}