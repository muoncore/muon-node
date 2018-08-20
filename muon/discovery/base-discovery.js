var _ = require("underscore");
var logger = require('../infrastructure/logger');
var uuid = require("uuid")

var BaseDiscovery = function (impl, frequency) {

  this.instanceId = uuid.v4()

  this.impl = impl
  if (!frequency) frequency = 3000; //broadcast frequency ms
  this.cacheFillTime = 5500;
  this.frequency = frequency;
  this.descriptors = [];

  var _this = this;

  _this.discoveryInitiated = false;
  _this.serviceList = []

  _this.clearCacheInterval = setInterval(function () {
    var now = new Date().getTime()
    _this.serviceList = _.filter(_this.serviceList, function (svc) {
      var ret = (now - svc.time) < _this.cacheFillTime
      return ret
    })
  }, 500)

  this.discoveredServices = {
    find: function (name) {
      logger.debug("DISCOVERY [" + _this.instanceId + "]: Searching for service " + name + " in list " + JSON.stringify(_this.serviceList.length))
      return _this.serviceList.find(function (svc) {
        return svc.identifier == name
      })
    },
    findServiceWithTags: function (tags) {
      var ret = _.find(_this.serviceList, function (svc) {
        var matchingTags = _.filter(svc.tags, function (tag) {
          return tags.indexOf(tag) >= 0
        })
        return matchingTags.length == tags.length
      })
      return ret
    },
    serviceList: function () {
      return _this.serviceList
    }
  }

  var then = new Date().getTime()

  this.impl.connect(function () {
    _this.discoveryInitiated = true

    _this.startAnnouncements()
  }, _this.addFoundServices.bind(_this), function() {
    return _this.serviceList
  })
}

BaseDiscovery.prototype.discoveryInitiated= function () {
  this.discoveryInitiated = true
}

BaseDiscovery.prototype.addFoundServices = function (svcList) {
  var _this = this

  var time = new Date().getTime()
  _.each(svcList, function(svc) {
    var service = _.findWhere(_this.serviceList, {"identifier": svc.identifier})
    if (!service) {
      service = svc
      _this.serviceList.push(service);
      logger.debug("[" + _this.instanceId + "] Service " + service.identifier + " is new, adding to the list")
    }

    service.time = time
  })

}


BaseDiscovery.prototype.advertiseLocalService = function (serviceDescriptor) {
  this.instanceId += "|" + serviceDescriptor.identifier
  this.descriptors.push(serviceDescriptor);
  this.addFoundServices([serviceDescriptor])

  var _this = this
  var reps = 0
  var interval = setInterval(function() {
    _this.addFoundServices([serviceDescriptor])
  }, 500)
};

BaseDiscovery.prototype.discoverServices = function (callback) {
  var _this = this
  setTimeout(function () {
    if (_this.discoveryInitiated) {
      callback({
        find: _this.discoveredServices.find.bind(_this.discoveredServices),
        findServiceWithTags: _this.discoveredServices.findServiceWithTags.bind(_this.discoveredServices),
        serviceList: _this.discoveredServices.serviceList()
      });
    } else {
      var interval = setInterval(function () {
        if (_this.discoveryInitiated) {
          clearInterval(interval)
          callback({
            find: _this.discoveredServices.find.bind(_this.discoveredServices),
            findServiceWithTags: _this.discoveredServices.findServiceWithTags.bind(_this.discoveredServices),
            serviceList: _this.discoveredServices.serviceList()
          });
        }
      }, 100)
    }
  }, 0);
};

BaseDiscovery.prototype.close = function () {
  logger.debug("[*** DISCOVERY:SHUTDOWN ***] closing connections...");
  this.shutdown();
};

BaseDiscovery.prototype.shutdown = function () {
  this.stopAnnounce()
  // clearInterval(this.clearCacheInterval)
  this.impl.shutdown()
};

BaseDiscovery.prototype.stopAnnounce = function () {
  clearInterval(this.announceInterval);
}

BaseDiscovery.prototype.startAnnouncements = function() {
  var _this = this
  _.each(_this.descriptors, function (it) {
    _this.impl.announce(it);
  });

  _this.announceInterval = setInterval(function () {
    _.each(_this.descriptors, function (response) {
      var discMsg = response;
      _this.impl.announce(discMsg);
    });
  }, _this.frequency);
}


module.exports = BaseDiscovery
