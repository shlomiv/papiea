FROM nutanix-docker.jfrog.io/papiea:base

COPY . /code
WORKDIR /code/papiea-engine
RUN cd /code \
    # Use cached node_modules
    && mv /node_modules /code/papiea-engine/node_modules \
    && npm run install-all \
    && npm install -g typescript \
    && npm --prefix papiea-engine run build-clj \
    && npm run build-all 

CMD /bin/bash -c "npm run start_differ & npm run start"
