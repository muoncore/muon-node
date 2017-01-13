
/*
var muoncore = require('../muon/api/muoncore.js');
var RQ = require("async-rq")

var amqpurl = "amqp://muon:microservices@localhost";
var muon = muoncore.create("test-client", amqpurl);

logger.info('Starting Soak Test');

function delay(milliseconds) {
  return function requestor(callback, value) {
    var timeout_id = setTimeout(function () {
      return callback(value);
    }, milliseconds);
    return function cancel(reason) {
      return clearTimeout(timeout_id);
    };
  };
}

function request(done, val) {
  logger.info('Requesting data ');
  var then = new Date().getTime()
  var promise = muon.request('rpc://awesomeservicequery/ping', {"search": "red"});
  promise.then(function (event) {
    var now = new Date().getTime()
    console.log("Latency is " + (now - then))
    done()
  }).catch(function(error) {
    console.dir("FAILED< BOOO " + error)
    done()
  })
}

function subscribe() {
    muon.subscribe("stream://awesomeservicequery/ticktock", {},
        function(data) {
            logger.error("Data...")
            console.dir(data)
        },
        function(error) {
            logger.error("Errored...")
            console.dir(error)
        },
        function() {
            logger.warn("COMPLETED STREAM")
        }
    )
}

var soak = RQ.sequence([
  RQ.parallel([
    request,
    request,
    request,
    request,
    request,
    request,
  ]),
  request,
  request,
  delay(6000),
  request,
  request,
  delay(10000),
  request,
  request,
  delay(20000),
  RQ.parallel([
    request,
    request,
    request,
    request,
    request,
    request,
    request,
    request,
    request,
    request,
    request,
    request,
  ]),
  delay(15000)
])

soak(function() {
  console.log("SOAK TEST DONE")
  process.exit(0)
})

// request()
//
// setTimeout(request, 6000)
// setTimeout(request, 6000)




// subscribe()
// subscribe()
// subscribe()
// subscribe()
// subscribe()
// subscribe()
// subscribe()
// subscribe()
// subscribe()
// subscribe()
// subscribe()
// subscribe()
// subscribe()
//
//
*/
