FROM quantumobile/papiea:1545645693

ADD code/package.json /package.json
ENV NODE_PATH /node_modules
RUN cd / && npm install

COPY . /code

RUN npm install
RUN npm run build-clj