var uuid = require('node-uuid');




exports.serviceNegotiationQueueName = function(serviceName) {

    var serviceQueueName = "service." + serviceName;
    return serviceQueueName;
}


exports.queueSettings = function() {
    var queueSettings = {
         durable: false,
         type: "direct",
         autoDelete: true,
         confirm: true
       };

       return queueSettings;
}


exports.handshakeRequest = function(protocol, sourceService, listenQueue, replyQueue ) {

  var msg = {
     eventType: "handshakeInitiated",
     PROTOCOL:"request",
     REPLY_TO:replyQueue,
     LISTEN_ON: listenQueue,
     SOURCE_SERVICE: sourceService
    };
   return {headers: msg};

}



exports.handshakeAccept = function() {

  var msg = {
        "eventType": "handshakeAccepted",
      "PROTOCOL":"request",
      "REPLY_TO":"stream-reply",
       "LISTEN_ON": "stream-listen",
       "SOURCE_SERVICE": "some-service"
    };
   return {headers: msg};

}
