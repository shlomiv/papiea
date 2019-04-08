FROM nutanix-docker.jfrog.io/papiea:base

COPY . /code
WORKDIR /code
RUN cd /code \
    # Use cached node_modules
    && mv /node_modules /code/node_modules \
    && npm install \
    && npm run build-clj

CMD npm run start
