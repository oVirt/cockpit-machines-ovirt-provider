
all: cockpit-machines-ovirt-provider

cockpit-machines-ovirt-provider:
	yarn run build
	mkdir -p dist
	cp build/static/js/main.*.js dist/index.js
	cp src/install.sh dist/
	cp src/machines-ovirt.css dist/

distclean:
	rm -rf build dist node_modules

# vim: ts=2
