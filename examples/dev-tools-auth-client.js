var muoncore = require('../muon/api/muoncore.js');
var assert = require('assert');
var expect = require('expect.js');

//
var amqpurl = "amqp://muon:microservices@localhost";



logger.info('starting muon...');
muon = muoncore.create("nodejs-client", amqpurl);
// or request://photon/projection-keys
var pingPromise = muon.request('rpc://aether/verify', "eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCJ9.eyJlbWFpbCI6Im15Lm5hbWVAaGVsbG8uY29tIiwiZmlyc3RuYW1lIjoiYmFyIiwibGFzdG5hbWUiOiJmb28iLCJpYXQiOjE0ODQ0MDk3MjZ9.T_jBsOEj9ongLC0yHRHPHmo1CucBye8n3vh9MFAX2_WdTJH4V6DvpghUaTMKZ4Dw1ITfJZb2Bc772UEZPB_Jev0rOd7cMs9JzPt919CTntZMNSzTDx0JI8begU_1ZtBEyD5Qg7SrrlkaMFRGkA5sgufz90Gn3L3_A5-h4dRgYLWC18yUvWJEIVUA5Ap8ThnC2vCO8gAPFgn1Wu4mXGYv6XrVIxUEYRYUYnQJ6BoJwbnOKbNO69VyI-2Y2jY4h7Eyej989QukpdSrURsOkbbYgrrVzY_2tWnAa43Lf-L8m0ibeiUqN5uUnSkSnZU7NqF3Yni-78fsh10hhOUBWgU3QQ");

pingPromise.then(function (event) {
    logger.warn('*****************************************************************************************');
    logger.warn("dev-tools-client server response received! event=" + JSON.stringify(event));
    assert.equal("i love dogs", event.body);
    process.exit(0);
}, function (err) {
    logger.error("dev-tools-client muon error!!!!!");
    process.exit(0);
}).catch(function(error) {
    logger.error("dev-tools-client promise.then() error!!!!!: \n" + error.stack);
    process.exit(0);
});
