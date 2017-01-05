var muoncore = require('../muon/api/muoncore.js');


//
var amqpurl = "amqp://muon:microservices@localhost";
//var amqpurl = 'amqp://guest:guest@conciens.mooo.com';

logger.info('starting muon...');
var muon = muoncore.create("test-client", amqpurl);

console.log("Starting replay!")

muon.replay("something",
    {},
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
