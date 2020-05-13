default: papiea-build


.PHONY: run-papiea papiea-build stop-papiea run-tests run-benchmark run-benchmark-local


run-benchmark-local: run-papiea
	cd ./papiea-engine; \
	docker-compose exec papiea-engine bash -c 'cd __benchmarks__ && npm i && npm run bench-local'


run-papiea: papiea-build
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


papiea-build: node_modules
	npm run build-all


node_modules:
	npm run install-all; \
	cd ./papiea-engine/__benchmarks__; \
	npm install


stop-papiea:
		cd ./papiea-engine; \
        if [ -z `docker-compose ps -q papiea-engine` ] || [ -z `docker ps -q --no-trunc | grep $$(docker-compose ps -q papiea-engine)` ]; then \
			echo 'Papiea not running'; \
		else \
		  docker-compose kill; \
        fi


run-tests: run-papiea
	cd ./papiea-engine; \
	docker-compose exec papiea-engine npm run test; \
	docker-compose exec papiea-engine bash -c 'cd /code/papiea-sdk && npm test'


run-benchmark: node_modules
	cd ./papiea-engine/__benchmarks__; \
	npm run bench -- $(ARGS)


clean-all: clean-build clean-node-modules


clean-node-modules:
	for p in core client backend-utils engine sdk; do rm -rf papiea-$$p/node_modules; done; \
	cd ./papiea-engine/__benchmarks__; \
	rm -rf node_modules

clean: clean-build

clean-build:
	npm run clean-all; \
	cd ./papiea-engine/__benchmarks__; \
	rm -rf build

clean-package-lock:
	for p in core client backend-utils engine sdk; do rm -rf papiea-$$p/package-lock.json; done; \
	cd ./papiea-engine/__benchmarks__; \
	rm -rf package-lock.json
