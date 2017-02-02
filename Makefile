
all: cockpit-machines-ovirt-provider

cockpit-machines-ovirt-provider:
	npm run build
	mkdir -p dist
	cp build/static/js/main.*.js dist/index.js
	cp src/install.sh dist/

distclean:
	rm -rf build dist node_modules

# vim: ts=2
