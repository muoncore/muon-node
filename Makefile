


install:
	npm install
	npm link

testlocal:
	./node_modules/mocha/bin/mocha -R mocha-multi --reporter-options xunit=test-results/file.xml,spec=- --recursive

test: install
	mkdir -p test-results/
	docker-compose up -d
	docker-compose build nodetests
	-docker-compose run nodetests
	docker-compose down


.PHONY: test