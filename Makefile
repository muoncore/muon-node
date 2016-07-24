


install:
	npm install
	npm link

testlocal:
	./node_modules/mocha/bin/mocha -R mocha-multi --reporter-options xunit=file.xml,spec=- --recursive

test: install
	docker-compose up -d
	docker-compose build nodetests
	-docker-compose run nodetests
	docker-compose down


.PHONY: test