#!/bin/bash

#  This executes the protocol specs against this client library.
#  This must orchestrate a minimal environment, bootup the local TCK endpoint
#  and then execute the protocol specs against it, in the form of the muon-protocol-specs task container.

LOCALDIR=$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )

npm install
docker-compose build
docker-compose up -d rabbitmq muon-node-tck-endpoint

rm -rf $LOCALDIR/test-results
mkdir $LOCALDIR/test-results

sleep 10

docker-compose run muon-tck $@
#docker run --link muonjava_rabbitmq_1:rabbitmq  -v $LOCALDIR/test-results:/app/test-results simplicityitself/muon-amqp-protocol-spec

docker-compose stop --timeout 2

echo "Tests Completed, results are at $LOCALDIR/test-results"
