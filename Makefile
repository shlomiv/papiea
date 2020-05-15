default: build_all

.PHONY: run-papiea papiea-build stop-papiea run-tests run-benchmark run-benchmark-local node_modules_bench \
node_modules_main node_modules_deps clean-node-modules clean clean-all build_main build_bench build_deps \
build_all run-papiea-debug

papiea-packages = core client backend-utils engine sdk

run-benchmark-local: build_bench run-papiea
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


build_all: build_bench

node_modules_deps:
	yarn --cwd papiea-core; \
	yarn --cwd papiea-backend-utils; \
	yarn --cwd papiea-client; \


build_deps: node_modules_deps
	yarn --cwd papiea-core run build; \
	yarn --cwd papiea-backend-utils run build; \
	yarn --cwd papiea-client upgrade; \
	yarn --cwd papiea-client run build


node_modules_main: build_deps
	yarn --cwd papiea-engine; \
	yarn --cwd papiea-sdk


build_main: node_modules_main
	yarn --cwd papiea-engine run build; \
	yarn --cwd papiea-sdk run build


node_modules_bench: build_main
	yarn --cwd papiea-engine/__benchmarks__; \


build_bench: node_modules_bench
	yarn --cwd papiea-engine/__benchmarks__ run build; \


stop-papiea:
	cd ./papiea-engine; \
		if [ -z `docker-compose ps -q papiea-engine` ] || [ -z `docker ps -q --no-trunc | grep $$(docker-compose ps -q papiea-engine)` ]; then \
		echo 'Papiea not running'; \
	else \
	  docker-compose kill; \
	fi


run-tests: run-papiea
	cd ./papiea-engine; \
	docker-compose exec papiea-engine yarn run test; \
	docker-compose exec papiea-engine bash -c 'cd /code/papiea-sdk && npm test'


run-benchmark: build_main
	cd ./papiea-engine/__benchmarks__; \
	yarn run bench -- $(ARGS)


clean-all: clean-node-modules clean


clean-node-modules:
	for p in $(papiea-packages) ; do rm -rf papiea-$$p/node_modules; done; \
	cd ./papiea-engine/__benchmarks__; \
	rm -rf node_modules


clean:
	yarn run clean-all; \
	cd ./papiea-engine/__benchmarks__; \
	rm -rf build


