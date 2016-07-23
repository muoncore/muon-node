


install:
	npm install
	npm link

test:
	./node_modules/mocha/bin/mocha --reporter mocha-teamcity-reporter --recursive


.PHONY: test