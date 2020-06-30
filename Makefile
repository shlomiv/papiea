default: build_all

.PHONY: run-papiea papiea-build stop-papiea run-tests run-benchmark run-benchmark-local \
node_modules_main node_modules_deps clean-node-modules clean clean-all build_main build_deps \
build_all run-papiea-debug

papiea-packages = core client backend-utils engine sdk


run-tests: run-papiea
	cd ./papiea-engine; \
	docker-compose exec papiea-engine yarn run test; \
	docker-compose exec papiea-engine bash -c 'cd /code/papiea-sdk/typescript && npm test'


run-benchmark: build_main
	cd ./papiea-engine/__benchmarks__; \
	yarn run bench -- $(ARGS)


run-benchmark-local: papiea-engine/__benchmarks__/build run-papiea
	cd ./papiea-engine; \
	docker-compose exec papiea-engine bash -c 'cd __benchmarks__ && npm run bench-local'


run-papiea: build_main
	cd ./papiea-engine; \
	if [ -z `docker-compose ps -q papiea-engine` ] || [ -z `docker ps -q --no-trunc | grep $$(docker-compose ps -q papiea-engine)` ]; then \
	docker-compose up -d; \
	  for i in `seq 1 10`; \
	  do \
		docker-compose logs --tail=5 papiea-engine | grep 'app listening on port' && echo Success && exit 0; \
		sleep 2; \
		docker-compose logs --tail=5; \
	  done \
	fi


run-papiea-debug: build_main
	cd ./papiea-engine; \
	if [ -z `docker-compose ps -q papiea-engine` ] || [ -z `docker ps -q --no-trunc | grep $$(docker-compose ps -q papiea-engine)` ]; then \
	docker-compose -f docker-compose-debug.yml up -d; \
	  for i in `seq 1 10`; \
	  do \
		docker-compose logs --tail=5 papiea-engine | grep 'app listening on port' && echo Success && exit 0; \
		sleep 2; \
		docker-compose logs --tail=5; \
	  done \
	fi


stop-papiea:
	cd ./papiea-engine; \
		if [ -z `docker-compose ps -q papiea-engine` ] || [ -z `docker ps -q --no-trunc | grep $$(docker-compose ps -q papiea-engine)` ]; then \
		echo 'Papiea not running'; \
	else \
	  docker-compose kill; \
	fi


build_all: papiea-engine/__benchmarks__/build


papiea-engine/__benchmarks__/build: papiea-engine/__benchmarks__/node_modules
	yarn --cwd papiea-engine/__benchmarks__ run build


papiea-engine/__benchmarks__/node_modules: build_main
	yarn --cwd papiea-engine/__benchmarks__


build_main: node_modules_main papiea-engine/build papiea-sdk/typescript/build


papiea-sdk/typescript/build:
	yarn --cwd papiea-sdk/typescript run build


papiea-engine/build:
	yarn --cwd papiea-engine run build


node_modules_main: build_deps papiea-engine/node_modules papiea-sdk/typescript/node_modules


papiea-sdk/typescript/node_modules:
	yarn --cwd papiea-sdk/typescript


papiea-engine/node_modules:
	yarn --cwd papiea-engine


build_deps: node_modules_deps papiea-backend-utils/build papiea-client/build


papiea-client/build:
	yarn --cwd papiea-client run build


papiea-backend-utils/build:
	yarn --cwd papiea-backend-utils run build


node_modules_deps: papiea-core/build papiea-backend-utils/node_modules papiea-client/node_modules


papiea-backend-utils/node_modules:
	yarn --cwd papiea-backend-utils


papiea-client/node_modules:
	yarn --cwd papiea-client


papiea-core/build: papiea-core/node_modules
	yarn --cwd papiea-core run build


papiea-core/node_modules:
	yarn --cwd papiea-core

clean-all: clean-node-modules clean


clean-node-modules:
	for p in $(papiea-packages) ; do rm -rf papiea-$$p/node_modules; done; \
	cd ./papiea-engine/__benchmarks__; \
	rm -rf node_modules


clean:
	yarn run clean-all; \
	cd ./papiea-engine/__benchmarks__; \
	rm -rf build


