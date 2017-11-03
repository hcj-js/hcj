#!/bin/sh

# install the dependencies
npm install

# start node server
node index.js > ./nodelog &
pid=$!

# wait for server to be up
while ! grep -m1 'up' < ./nodelog; do
    sleep 1
done

# use phantomjs to get page content
phantomjs -platform offscreen build.js > output

kill $pid
