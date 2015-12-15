#!/bin/bash

if [ -z "$1" ]
  then
  echo "No argument supplied. Must be either 'release' or 'snapshot'"
  exit -1
fi

DOCPATH=""

if [ $1 = "snapshot" ]; then
   echo "Is a snapshot build"
   DOCPATH="SNAPSHOT"
else
  echo "release"
  DOCPATH="latest"
fi

mkdir tempdocumentation
cd  tempdocumentation
rm -rf muon-documentation
git clone git@github.com:microserviceux/muon-documentation.git
cd  muon-documentation
mkdir -p node
rsync -avr --delete ../../doc/ node/$DOCPATH
rm node/$DOCPATH/*.iml
git add node/
git commit -m "Update NodeJS Documentation"
git push origin
rm -rf tempdocumentation
