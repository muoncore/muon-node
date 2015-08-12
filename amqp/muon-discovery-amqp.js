
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

            scope.broadcast.listenOnBroadcast("serviceAnnounce", function(event, message) {
                try {
                    var pay = message;
                    if(scope.discoveredServiceList.indexOf(pay.identifier) < 0) {
                        scope.discoveredServiceList.push(pay.identifier);
                        scope.discoveredServices.push(pay);
                    }
                } catch (err) {
                    logger.warn("Had issues parsing ... ");
                    console.dir(err);
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
                _.each(_this.descriptors, function(it) {
                    scope.broadcast.emit({
                        name:"serviceAnnounce",
                        payload:it
                    });
                });
            }, 3500);
        }
    }, 400);

}