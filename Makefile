


install:
	npm install
	npm link

test:
	./node_modules/mocha/bin/mocha -R mocha-multi --reporter-options mocha-teamcity-reporter=-,xunit=file.xml,doc=docs.html --recursive


.PHONY: test