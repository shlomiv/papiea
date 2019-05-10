#!/bin/sh

if [ -d "/node_modules" ] && [ ! -d "node_modules" ]; then
    echo "Use cached node_modules"
    mv /node_modules node_modules
fi

export DEBUG=express:*
npm install
npm run build-clj
wait-port $MONGO_HOST:$MONGO_PORT
if [ $HOT_RELOAD == 'true' ]
then
    npm run dev
else
    npm run start
fi
