FROM nutanix-docker.jfrog.io/papiea:base

COPY . /code
WORKDIR /code/papiea-engine
RUN cd /code \
    # Use cached node_modules
    && mv /node_modules /code/papiea-engine/node_modules \
    && apt-get install -y build-essential \
    && make \
    && npm --prefix papiea-engine run build-clj

CMD /bin/bash -c "yarn run start_differ & yarn run start"
