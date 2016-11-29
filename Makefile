


install:
	npm install -d
	npm link

testlocal:
	./node_modules/mocha/bin/mocha -R mocha-multi --reporter-options xunit=test-results/file.xml,spec=- --recursive

test:
	npm install -d
	mkdir -p test-results/
	docker-compose up -d
	docker-compose build nodetests
	-docker-compose run nodetests
	docker-compose down

publish:
	npm run build
	npm publish

.PHONY: test

