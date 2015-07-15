/* This program just simulates the kind of situations which my event handler function will be put through */
var updateSummary = require("./eventHandler.js"),
    fs            = require("fs");

// a summary of all events
var summary = {};

// now, each event wll be processed one at a time, to simulate a stream.
fs.readFileSync("./testData - Start.json").toString().split("\n").forEach(function(line){
  // for every raw event in the testData file, we add it to the summary
  summary = updateSummary(summary, JSON.parse(line) );
});

console.log(summary);
