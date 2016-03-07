var uuid = require('node-uuid');




exports.serviceNegotiationQueueName = function(serviceName) {

    var serviceQueueName = "muon.service.negotiation." + serviceName;
    return serviceQueueName;
}



