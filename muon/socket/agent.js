"use strict";
require('sexylog');
var moment = require('moment');
var messages = require('../domain/messages.js');

/**
  Muon SOcket Kep Alive Agent

  Sends ping messages to other socket host to ensure connection stays up
*/

class MuonSocketAgent {

  constructor(upstreamChannel, downstreamChannel, protocol, offsetMs) {

    this.upstreamChannel = upstreamChannel;
    this.downstreamChannel = downstreamChannel;

    if (! offsetMs) offsetMs = 0;
    this.offsetMs = offsetMs;
    this.lastOutboundMessageTimestamp = new Date();
    this.lastInboundMessageTimestamp = new Date();
    this.lastInboundPingTimestamp = new Date();

    var _outboundFunction = this.outbound; //'this' doesnt work in functions below
    var _inboundFunction = this.inbound; //'this' doesnt work in functions below

    upstreamChannel.rightConnection().listen(function(message) {
        this.lastOutboundMessageTimestamp = new Date();
        _outboundFunction(message, downstreamChannel.leftConnection());
    }.bind(this));

    downstreamChannel.leftConnection().listen(function(message) {
        if (message.step == 'keep-alive') {
          this.lastInboundPingTimestamp = new Date();
          // then discard the ping
        } else {
          _inboundFunction(message, upstreamChannel.rightConnection());
        }


    });

    var keepAlive =   function() {
        if (messageWasSentSince(this.lastOutboundMessageTimestamp, this.offsetMs)) return;
        var ping = messages.muonMessage({}, 'this', 'that', protocol, 'keep-alive');
        logger.trace('[*** MUON:SOCKET:AGENT:OUTBOUND ***] sending keep alive ping');
        this.downstreamChannel.leftConnection().send(ping);

      }.bind(this);

      if (this.offsetMs > 0) {
        setInterval(function() {
          //logger.trace('[*** MUON:SOCKET:AGENT:OUTBOUND ***] setInterval(f(){}, ' + this.repeatMs + 'ms)');
          keepAlive();
        }.bind(this), this.offsetMs);
      }

  }

  outbound(message, downstreamConnection) {
      logger.trace('[*** MUON:SOCKET:AGENT:OUTBOUND ***] forwarding message outbound');
      downstreamConnection.send(message);
  }

  inbound(message, upstreamConnection) {
      logger.trace('[*** MUON:SOCKET:AGENT:INBOUND ***] forwarding message inbound');
      if (message.step == 'keep-alive') {
          //discard

      } else {
          upstreamConnection.send(message);
      }

  }
/*
  setLastMessageTimestamp() {
      //console.log('setLastMessageTimestamp()', this);
      this.lastMessageTimestamp = new Date();
      logger.trace('this.lastMessageTimestamp=' + this.lastMessageTimestamp);
  }
*/


}


function messageWasSentSince(lastMessageTimepstamp, offsetMs) {
  var moment1 = moment(lastMessageTimepstamp).add(offsetMs, 'milliseconds');
  var moment2 = moment(new Date());
  //logger.trace('moment1/moment2: ' + moment1 + "/" + moment2);
  var inTimeWindow = (moment2).isBefore(moment1) ;
  //logger.trace('[*** MUON:SOCKET:AGENT:OUTBOUND ***] message sent since ' + ms + 'ms: ' + inTimeWindow);
  return inTimeWindow;
}

module.exports = MuonSocketAgent;

/*



*/
