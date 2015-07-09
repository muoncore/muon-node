
echo Running node server
node muon-node-server.js &

echo waiting 5s...
sleep 5


echo running client query...
node muon-node-client.js 
