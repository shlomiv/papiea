FROM nutanix-docker.jfrog.io/papiea:base

COPY . /code
WORKDIR /code/papiea-engine
RUN cd /code \
    # Use cached node_modules
    && mv /node_modules /code/papiea-engine/node_modules \
    && apt-get update \
    && apt-get install -y build-essential \
    && npm --prefix papiea-engine run build-clj

# Install yarn
RUN curl -o- -L yarnpkg.com/install.sh | bash
ENV PATH="/root/.yarn/bin:/root/.yarn/bin:/root/.config/yarn/global/node_modules/.bin:${PATH}"

RUN cd /code && make

CMD /bin/bash -c "yarn run start_differ & yarn run start"
