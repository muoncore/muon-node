"use strict";
require('sexylog');

class MuonSocketAgent {



  constructor(upstreamChannel, downstreamChannel) {
    this.upstreamChannel = upstreamChannel;
    this.downstreamChannel = downstreamChannel;

    var _outboundFunction = this.outbound;
    var _inboundFunction = this.inbound;

    upstreamChannel.rightConnection().listen(function(message) {
        _outboundFunction(message, downstreamChannel.leftConnection());
    });

    downstreamChannel.leftConnection().listen(function(message) {
        _inboundFunction(message, upstreamChannel.rightConnection());
    });

  }


  outbound(message, outboundConnection) {
      logger.debug('**** AGENT MESSAGE PASSTHROUGH OUTBOUND');
      outboundConnection.send(message);
  }

  inbound(message, inboundConnection) {
      logger.debug('**** AGENT MESSAGE PASSTHROUGH INBOUND');
      inboundConnection.send(message);
  }



}





module.exports = MuonSocketAgent;
