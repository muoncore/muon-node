var assert = require('assert');
var fs = require('fs');


var muonCore = require("../muon");
var amqpUrl = "amqp://muon:microservices@localhost";
var serviceName = "muon-config-test";

var muon = muonCore.generateMuon(serviceName, amqpUrl);
assert(muon);



describe("Simple muon resource client/server test", function () {

    this.timeout(7000);

        it("test1: send event to photon", function (done) {

             var payload = { 'service-id': 'muon://photon/events', 'local-id': 'abc123xyz',
                                           payload: { user: { id: '0002', first: 'Gawain', last: 'Hammond', password: 'testing', stream: 'users' } },
                                           'stream-name': 'photontest', 'server-timestamp': 1441634631338 };

            muon.command('muon://photon/events' , payload, function(event, payload) {
                    console.log('photon client: response event: ', event);
                    console.log('photon client: response payload :',payload);

                        //assert.equal(payload.message, serverMessage, 'server response message');
                        done();

             });

        });


     it("test2: add projection", function (done) {

            var projectionName = 'photontest-projection';

             var filename = './end2endTests/' + projectionName + '.js';

             logger.info("Installing " + filename);
             logger.info('++++++++++++++++++++++++++++++++');
             logger.info(filename);
             logger.info('++++++++++++++++++++++++++++++++');
             logger.info("loading file: " + filename);

             var projectionString = fs.readFileSync(filename, 'utf8');
             var projectionWrapper = {
                 "projection-name": projectionName,
                 "stream-name": "photontest",
                 "language": "javascript",
                 "initial-value": '{}',
                 "filter": "",
                 "reduction": projectionString
             };

             logger.info("insert_projection() inserting projection via muon: " + filename);
             //callback({event: {}, payload: {}});
             muon.command('muon://photon/projections', projectionWrapper, function (event, payload) {
                 logger.info("projection " + projectionName + " response: ", event);

                done();
             });

        });










});

