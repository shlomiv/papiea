FROM nutanix-docker.jfrog.io/papiea:base

COPY . /code
WORKDIR /code/papiea-engine
RUN cd /code \
    && apt-get update \
    && apt-get install -y build-essential \
    && npm --prefix papiea-engine run build-clj

# Install yarn
RUN curl -o- -L yarnpkg.com/install.sh | bash
ENV PATH="${PATH}:/root/.yarn/bin"

RUN cd /code && make

CMD /bin/bash -c "yarn run start_differ & yarn run start"
