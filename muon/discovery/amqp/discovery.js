var _ = require("underscore");
var AmqpConnection = require('./infra/amqp-connection.js');
var Broadcast = require('./infra/amqp-broadcast.js');
require('sexylog');

var AmqpDiscovery = function (url, frequency) {

    if (! frequency) frequency = 3000; //broadcast frequency ms
    this.frequency = frequency;
    this.descriptors = [];
    this.callbacks = [];

    var _this = this;

    logger.debug("[*** DISCOVERY:BOOTSTRAP ***] AMQP Discovery is booting using URL " + url);
    _this.discoveryInitiated = false;
    _this.connection = new AmqpConnection(url);
    _this.url = url;

    _this.connection.connect(function() {
        logger.info("[*** DISCOVERY:BOOTSTRAP ***] AMQP Discovery is ready!!");
        _this.broadcast = new Broadcast(_this.connection);
        startAnnouncements(_this);
    });

    this.discoveredServices = {
        find: function(name) {
            for (var i = 0 ; i < this.serviceList.length ; i++) {
                if (this.serviceList[i].identifier == name) {
                    return this.serviceList[i];
                };
            }
            return null;
        },
        serviceList: [],
        addFoundService(svc) {
            this.serviceList.push(svc);
            if (! _this.discoveryInitiated) {
              setTimeout(function() {
                _this.discoveryInitiated = true;
              }, 100);
            }
        }
    };

};




AmqpDiscovery.prototype.advertiseLocalService = function (serviceDescriptor) {
    this.descriptors.push(serviceDescriptor);
};
AmqpDiscovery.prototype.clearAnnouncements = function () {
    this.descriptors = [];
};

AmqpDiscovery.prototype.discoverServices = function (callback) {
  var _this = this;
  var interval = setInterval(function() {
      if (_this.discoveryInitiated) {
        clearInterval(interval);
        setTimeout(function() {
            callback(_this.discoveredServices);
        }, 500);
      }
  }, _this.frequency);
};

AmqpDiscovery.prototype.close = function () {
    logger.debug("[*** DISCOVERY:SHUTDOWN ***] closing connections...");
    this.connection.close();
};

AmqpDiscovery.prototype.shutdown = function () {
    logger.debug("[*** DISCOVERY:SHUTDOWN ***] shutting down connections...");
    this.connection.close();
};

function startAnnouncements(discovery) {
    var waitInterval = setInterval(function () {
        if (typeof discovery.broadcast !== 'undefined') {
            clearInterval(waitInterval);

            discovery.broadcast.listenOnBroadcast("discovery", function (event, message) {
                try {
                    var pay = message;
                    if (discovery.discoveredServices.serviceList.indexOf(pay.identifier) < 0) {
                        discovery.discoveredServices.addFoundService(pay);
                    }
                } catch (err) {
                    logger.warn("[*** DISCOVERY ***] Had issues parsing discovery response");
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
                _.each(discovery.descriptors, function (response) {
                    var discMsg = {
                        name: "discovery",
                        payload: response
                    };
                    logger.debug('[*** DISCOVERY ***] broadcasting discovery services: ' + JSON.stringify(discMsg));
                    discovery.broadcast.emit(discMsg);
                });
            }, discovery.frequency);
        }
    }, 400);
}

module.exports = AmqpDiscovery;
