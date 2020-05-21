FROM nutanix-docker.jfrog.io/papiea:base

COPY . /code
WORKDIR /code/papiea-engine
RUN cd /code \
    # Use cached node_modules
    && mv /node_modules /code/papiea-engine/node_modules \
    && make build_all \
    && npm install -g typescript \
    && npm --prefix papiea-engine run build-clj

CMD /bin/bash -c "yarn run start_differ & yarn run start"
