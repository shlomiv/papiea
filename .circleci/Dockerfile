FROM nutanix-docker.jfrog.io/papiea:latest

COPY . /code

WORKDIR /code

RUN apt-get update && apt-get upgrade -y \
    && apt-get install -y locales \
    && echo "en_US.UTF-8 UTF-8" >> /etc/locale.gen \
    && locale-gen \
    # For leiningen
    && apt-get install -y wget curl openjdk-11-jdk \
    # Cleanup
    && apt-get clean && rm -rf /var/lib/apt/lists/* /tmp/* /var/tmp/*
ENV LC_ALL=en_US.UTF-8 LANG=en_US.UTF-8 LC_CTYPE=en_US.UTF-8 LANGUAGE=en_US:en

ENV LEIN_ROOT true
RUN wget -q -O /usr/bin/lein \
    https://raw.githubusercontent.com/technomancy/leiningen/2.8.1/bin/lein \
    && chmod +x /usr/bin/lein
RUN lein

ADD papiea-lib-clj/project.clj /project.clj
RUN cd / && lein deps && lein cljsbuild once && rm project.clj

RUN cd papiea-lib-clj && lein cljsbuild once
