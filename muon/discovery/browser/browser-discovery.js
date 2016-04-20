var _ = require("underscore");

var BrowserDiscovery = function (url) {

    logger.debug("Browser Discovery is booting using URL " + url);

    this.discoveredServiceList = [];
    this.discoveredServices = [];

    var _this = this;

    var ws = new WebSocket(url, "protocolOne");

    ws.onmessage = function (event) {
        try {
            var pay = event.data;
            if (_this.discoveredServiceList.indexOf(pay.identifier) < 0) {
                _this.discoveredServiceList.push(pay.identifier);
                _this.discoveredServices.push(pay);
            }
        } catch (err) {
            console.warn("Had issues parsing ... ");
        }
    };
};

BrowserDiscovery.prototype.advertiseLocalService = function (serviceDescriptor) {
    console.warn("Attempted to advertise this service. This is not available in browser");
};
BrowserDiscovery.prototype.clearAnnouncements = function () {
    this.descriptors = [];
};

BrowserDiscovery.prototype.discoverServices = function (callback) {
    callback(this.discoveredServices);
};

BrowserDiscovery.prototype.close = function () {
    logger.trace("closing connections...");
};

module.exports = BrowserDiscovery;