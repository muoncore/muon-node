
var uuid = require('node-uuid');
var _ = require("underscore");
var signals = require("signals");

module.exports = function(muon, discoveryService, tags) {

    module.discovery = discoveryService;
    module.muon = muon;


    return {
        resolveFullUrl: resolveFullUrl
    };
};


function resolveFullUrl(url){



}