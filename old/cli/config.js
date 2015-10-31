require("../lib/logging/logger");
var fs = require('fs');

var discoveryConfig;
var discoveryConfigFile;

module.exports = function() {

    if (process.env.RABBITMQ_PORT_5672_TCP_ADDR !== "undefined" && process.env.RABBITMQ_PORT_5672_TCP_ADDR != null) {
        logger.debug("Running inside a Docker/ RabbitMQ environment. Autoconfiguring to connect to connect to linked container " + process.env.RABBITMQ_PORT_5672_TCP_ADDR);

        return discoveryConfig = [{
            "name":"docker",
            "type":"amqp",
            "uri":"amqp://muon:microservices@" + process.env.RABBITMQ_PORT_5672_TCP_ADDR,
            "default":true
        }];
    } else {
        logger.debug("Normal environment detected, looking for configuration file");
        try {
            discoveryConfigFile = getUserHome() + '/.muon/discovery.json';
            return JSON.parse(fs.readFileSync(discoveryConfigFile, 'utf8'));
        } catch (e) {
            noConfigFile(discoveryConfigFile);
            exit()
        }
    }
};

function noConfigFile(discoveryConfigFile) {
    console.log("\n\nNo Discovery file found at " + discoveryConfigFile);
    console.log("You can generate a default file by running 'muon setup'\n\n");
}

function getUserHome() {
    return process.env[(process.platform == 'win32') ? 'USERPROFILE' : 'HOME'];
}

function exit() {
    process.exit(0);
}