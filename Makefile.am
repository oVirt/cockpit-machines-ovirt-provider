#    Copyright 2017 Red Hat Inc.
#
#    Licensed under the Apache License, Version 2.0 (the "License");
#    you may not use this file except in compliance with the License.
#    You may obtain a copy of the License at
#
#        http://www.apache.org/licenses/LICENSE-2.0
#
#    Unless required by applicable law or agreed to in writing, software
#    distributed under the License is distributed on an "AS IS" BASIS,
#    WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
#    See the License for the specific language governing permissions and
#    limitations under the License.

OVIRT_CACHE_DIR	?= $(HOME)/ovirt-cache
PROVIDER_DIR = $(datarootdir)/cockpit/machines/provider

SHELL := /bin/bash
export PATH := /usr/share/ovirt-engine-nodejs/bin:../node_modules/.bin:$(PATH)

EXTRA_DIST = \
	autogen.sh \
	cockpit-machines-ovirt-provider.spec \
	cockpit-machines-ovirt-provider.spec.in \
	README.md \
	LICENSE \
	src \
	config \
	scripts \
	package.json \
	yarn.lock
	

DISTCLEANFILES = $(PACKAGE)-$(VERSION).tar.gz \
	aclocal.m4 \
	configure \
	install-sh \
	missing \
	Makefile.in

DISTCLEANDIRS = autom4te.cache \
	engine-plugin \
	tmp.repos \
	build \
	dist

TMPREPOS = tmp.repos
RPMBUILD_ARGS := 
RPMBUILD_ARGS += --define="_topdir `pwd`/$(TMPREPOS)"
RPMBUILD_ARGS += $(if $(RELEASE_SUFFIX), --define="release_suffix $$RELEASE_SUFFIX")

srpm:	dist
	rm -fr "$(TMPREPOS)"
	mkdir -p $(TMPREPOS)/{SPECS,RPMS,SRPMS,SOURCES}
	$(RPMBUILD) $(RPMBUILD_ARGS) -ts "$(PACKAGE_TARNAME)-$(PACKAGE_VERSION).tar.gz"
	@echo
	@echo "srpm available at '$(TMPREPOS)'"
	@echo

rpm:	srpm
	$(RPMBUILD) $(RPMBUILD_ARGS) --rebuild "$(TMPREPOS)"/SRPMS/*.src.rpm
	@echo
	@echo "rpm(s) available at '$(TMPREPOS)'"
	@echo

snapshot-rpm:
	make rpm RELEASE_SUFFIX=".$$(date --utc +%Y%m%d).git$$(git rev-parse --short HEAD)"

publish:
	mkdir -p $(OVIRT_CACHE_DIR)
	rsync -aq $(TMPREPOS)/ $(OVIRT_CACHE_DIR)/ovirt
	createrepo $(OVIRT_CACHE_DIR)/ovirt

distclean-local:
	rm -rf ${DISTCLEANDIRS}

.PHONY: rpms publish srpms

all: cockpit-machines-ovirt-provider

cockpit-machines-ovirt-provider:
	$(YARN) run build
	$(MKDIR_P) dist
	cp build/static/js/main.*.js dist/index.js
	cp src/install.sh dist/
	cp src/machines-ovirt.css dist/

install-data-local:
	$(MKDIR_P) $(DESTDIR)$(PROVIDER_DIR)
	cp -rpv dist/* $(DESTDIR)$(PROVIDER_DIR)

check-local: 
	$(YARN) test

# vim: ts=2
