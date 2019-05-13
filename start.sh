#!/bin/sh

if [ -d "/node_modules" ] && [ ! -d "node_modules" ]; then
    echo "Use cached node_modules"
    mv /node_modules node_modules
fi

npm install
npm run build-clj
wait-port mongo:27017
if [ $HOT_RELOAD == 'true' ]
then
    npm run dev
else
    npm run start
fi
