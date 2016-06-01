"use strict";

class Handler {

  constructor() {
    console.log('constructor()');

  }

  incoming() {
    console.log('incoming()');
  }

  outgoing() {
    console.log('outgoing()');
  }
}

module.exports = Handler;
