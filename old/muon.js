
var MuonConfig = require("./core/muon-config.js");

module.exports.generateMuon = function(serviceName, discoveryUrl) {
    return new MuonConfig().generateMuon(serviceName, discoveryUrl);
};
