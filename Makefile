run-papiea: benchmark-install
	cd ./papiea-engine; \
	if [ -z `docker-compose ps -q papiea-engine` ] || [ -z `docker ps -q --no-trunc | grep $$(docker-compose ps -q papiea-engine)` ]; then \
      docker-compose up -d; \
	  for i in `seq 1 10`; \
	  do \
		docker-compose logs --tail=5 papiea-engine | grep 'app listening on port' && echo Success && exit 0; \
		sleep 15; \
		docker-compose logs --tail=5; \
	  done \
    fi


papiea-build:
	npm run build-all


papiea-install:
	npm run install-all


benchmark-install: papiea-install papiea-build
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


run-benchmark: benchmark-install
	cd ./papiea-engine/__benchmarks__; \
	npm run bench -- $(ARGS)


run-benchmark-local: run-papiea
	cd ./papiea-engine; \
	docker-compose exec papiea-engine bash -c 'cd __benchmarks__ && npm i && npm run bench-local'


clean-all:
	npm run clean-all; \
	cd ./papiea-engine/__benchmarks__; \
	rm -rf node_modules
