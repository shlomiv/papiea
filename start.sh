#!/bin/sh

if [ -d "/node_modules" ] && [ ! -d "node_modules" ]; then
    echo "Use cached node_modules"
    mv /node_modules node_modules
fi

export DEBUG=express:* 
npm install
npm run build-clj
if [ $HOT_RELOAD ]
then
    npm run dev
else
    npm run start
fi
