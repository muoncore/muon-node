
/**
 * Reactive streams Client Control API.
 * 
 * For first cut, present a simple callback based API wrapper around the reactive stream API message proto that the 
 * underlying protocol implements
 */

module.exports = function(protocolchannel, callback, errorCallback) {

    //hook up a handler to the proto channel
    
    //start the protocol off.
    
    //listen to messages out of the proto
      // if DATA, exec callback
      // if error, exec errorCallback
      // if complete, terminate.
    
    //for every 10 messages, send a REQUEST to the channel to get more data
    
}