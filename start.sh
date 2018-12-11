#!/bin/sh

npm run build-clj
npm run build
#npm run test
node lib/main.js