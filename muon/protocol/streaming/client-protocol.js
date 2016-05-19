
var messages = require("../../domain/messages")

require("sexylog")

/**
 * Reactive streams Client Protocol
 *
 *
 * subscriber. This is simplistic, and needs to be updated
 *
 * {
 *   onSubscribe: function( subscription { 
 *      request: function(n)
 *      cancel: function()
 *   })
 *   onNext: function(data)
 *   onError: function(error)
 *   onComplete: function()
 * }
 *
 */

module.exports.create = function(
    subscriber, 
    transportchannel, 
    targetService, 
    localService,
    targetStream,
    args) {
    
    transportchannel.listen(function(data) {
       switch(data.step) {
           case "SubAck":
               subscriber.onSubscribe({
                       cancel: function() {
                           var msg = messages.muonMessage(
                               {}, localService, targetService, "reactive-stream", "Cancelled")
                           transportchannel.send(msg)
                       },
                       request: function(amount) {
                           var msg = messages.muonMessage(
                               {request:amount}, localService, targetService, "reactive-stream", "DataRequested")
                           transportchannel.send(msg)
                       }
                   })
               break;
           case "SubNack":
               subscriber.onError("Stream does not exist")
               break
           case "Data":
               subscriber.onNext(messages.decode(data.payload))
               break
           case "Errored":
               subscriber.onError(messages.decode(data.payload))
               break
           case "Completed":
               subscriber.onComplete()
               break
           default:
               logger.warn("Reactive Stream Client: Unknown step '" + data.step + "'")
       }
    })


    return {
        start: function() {
            var msg = messages.muonMessage({
                streamName: targetStream,
                args: args
            }, localService, targetService, "reactive-stream", "SubscriptionRequested")
            transportchannel.send(msg)
        }
    }
}