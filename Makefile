


install:
	npm install
	npm link

test:
	./node_modules/mocha/bin/mocha -R mocha-multi --reporter-options xunit=file.xml,spec=- --recursive

testtc:
	./node_modules/mocha/bin/mocha -R mocha-multi --reporter-options mocha-teamcity-reporter=-,xunit=file.xml --recursive


.PHONY: test