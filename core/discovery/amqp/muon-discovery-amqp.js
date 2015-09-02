var _ = require("underscore");
var AmqpConnection = require('../../transport/amqp/amqp-connection.js');
var Broadcast = require('../../transport/amqp/amqp-broadcast.js');

var AmqpDiscovery = function (url) {

    this.descriptors = [];
    var _this = this;

    logger.debug("AMQP Discovery is booting using URL " + url);

    _this.connection = new AmqpConnection(url);
    _this.url = url;

    _this.connection.connect(function() {
        logger.debug("AMQP Discovery ready!");
        _this.broadcast = new Broadcast(_this.connection);
        startAnnouncements(_this);
    });

    this.discoveredServiceList = [];
    this.discoveredServices = [];

};

AmqpDiscovery.prototype.announceService = function (serviceDescriptor) {
    this.descriptors.push(serviceDescriptor);
};
AmqpDiscovery.prototype.clearAnnouncements = function () {
    this.descriptors = [];
};

AmqpDiscovery.prototype.discoverServices = function (callback) {
    callback(this.discoveredServices);
};

function startAnnouncements(discovery) {
    var waitInterval = setInterval(function () {
        logger.debug("discovery waiting .. " + discovery.broadcast);
        if (typeof discovery.broadcast !== 'undefined') {
            clearInterval(waitInterval);

            discovery.broadcast.listenOnBroadcast("serviceAnnounce", function (event, message) {
                try {
                    var pay = message;
                    if (discovery.discoveredServiceList.indexOf(pay.identifier) < 0) {
                        discovery.discoveredServiceList.push(pay.identifier);
                        discovery.discoveredServices.push(pay);
                    }
                } catch (err) {
                    logger.warn("Had issues parsing ... ");
                    console.dir(err);
                }
            });

            _.each(discovery.descriptors, function (it) {
                discovery.broadcast.emit(
                    {
                        name: "serviceAnnounce",
                        payload: it
                    });
            });

            setInterval(function () {
                _.each(discovery.descriptors, function (it) {
                    discovery.broadcast.emit({
                        name: "serviceAnnounce",
                        payload: it
                    });
                });
            }, 3500);
        }
    }, 400);

}

module.exports = AmqpDiscovery;