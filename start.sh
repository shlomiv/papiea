#!/bin/sh

if [ -d "/node_modules" ] && [ ! -d "node_modules" ]; then
    echo "Use cached node_modules"
    mv /node_modules node_modules
fi

HOST=${$MONGO_HOST:-'mongo'}
PORT=${$MONGO_PORT:-'27017'}
export DEBUG=express:*
npm install
npm run build-clj
wait-port $HOST:$PORT
if [ $HOT_RELOAD == 'true' ]
then
    npm run dev
else
    npm run start
fi
