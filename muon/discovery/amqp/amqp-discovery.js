var _ = require("underscore");
var AmqpConnection = require('./infra/amqp-connection.js');
var Broadcast = require('./infra/amqp-broadcast.js');

var AmqpDiscovery = function (url) {

    this.descriptors = [];
    var _this = this;

    logger.debug("AMQP Discovery is booting using URL " + url);

    _this.connection = new AmqpConnection(url);
    _this.url = url;

    _this.connection.connect(function() {
        logger.info("AMQP Discovery is ready!!");
        _this.broadcast = new Broadcast(_this.connection);
        startAnnouncements(_this);
    });

    this.discoveredServiceList = [];
    this.discoveredServices = [];

};

AmqpDiscovery.prototype.advertiseLocalService = function (serviceDescriptor) {
    this.descriptors.push(serviceDescriptor);
};
AmqpDiscovery.prototype.clearAnnouncements = function () {
    this.descriptors = [];
};

AmqpDiscovery.prototype.discoverServices = function (callback) {
    callback(this.discoveredServices);
};

AmqpDiscovery.prototype.close = function () {
    logger.trace("closing connections...");
    this.connection.close();
};

function startAnnouncements(discovery) {
    var waitInterval = setInterval(function () {
        if (typeof discovery.broadcast !== 'undefined') {
            clearInterval(waitInterval);

            discovery.broadcast.listenOnBroadcast("discovery", function (event, message) {
                try {
                    var pay = message;
                    if (discovery.discoveredServiceList.indexOf(pay.identifier) < 0) {
                        discovery.discoveredServiceList.push(pay.identifier);
                        discovery.discoveredServices.push(pay);
                    }
                } catch (err) {
                    logger.warn("Had issues parsing ... ");
                    logger.warn(err);
                }
            });

            _.each(discovery.descriptors, function (it) {
                discovery.broadcast.emit(
                    {
                        name: "discovery",
                        payload: it
                    });
            });

            setInterval(function () {
                _.each(discovery.descriptors, function (it) {
                    discovery.broadcast.emit({
                        name: "discovery",
                        payload: it
                    });
                });
            }, 3500);
        }
    }, 400);
}

module.exports = AmqpDiscovery;