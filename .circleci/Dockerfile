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
ENV PATH="/root/.yarn/bin:${HOME}/.yarn/bin:${HOME}/.config/yarn/global/node_modules/.bin:${PATH}"
RUN echo "export PATH=${HOME}/.yarn/bin:${HOME}/.config/yarn/global/node_modules/.bin:${PATH}" >> ~/.bashrc
RUN /bin/bash -c "source ~/.bashrc"
RUN /bin/bash -c ". ~/.bashrc"

RUN echo $HOME && cd ~/.yarn/bin && pwd

RUN /bin/bash -c 'echo $HOME && cd ~/.yarn/bin && pwd'

RUN /bin/bash -c 'echo "$PATH"'

RUN /bin/bash -c 'pwd && ls && env'

RUN /bin/bash -c 'ls -ltr ~/.yarn/bin'

RUN /bin/bash -c 'which yarn'

RUN /bin/basb -c '~/.yarn/bin/yarn'

RUN cd /code && make

CMD /bin/bash -c "yarn run start_differ & yarn run start"
