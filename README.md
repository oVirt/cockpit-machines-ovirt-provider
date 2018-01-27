**This project has been migrated** under [Cockpit](http://www.cockpit-project.org), became base for [cockpit-machines-provider](https://github.com/cockpit-project/cockpit/tree/master/pkg/ovirt).

This source base is no more maintained.

-----

[![Build Status](https://travis-ci.org/oVirt/cockpit-machines-ovirt-provider.svg?branch=master)](https://travis-ci.org/oVirt/cockpit-machines-ovirt-provider)

# oVirt External Provider for Cockpit-machines
With this external provider, the `machines` plugin in Cockpit can redirect actions to oVirt REST API instead of default Libvirt.
 
Please refer to cockpit-machines [README.md](https://github.com/cockpit-project/cockpit/blob/master/pkg/machines/README.md) for external plugin description and API which is implemented by this project.

The entry point for the provider API implementation is `src/provider.js`.
It's fine to implement the API using `VanillaJS`, as far as the simple API contract is met.
 
For more complex scenarios `ES6, Babel, Webpack and React` can be leveraged as shown in this project. 

# Installation
Actual installation is as simple as copying 2 files.

Anyway, the project requires oVirt and Cockpit running. 

## General Prerequisites
No matter you are going to build from sources or install from RPM, following must be met:

 - the **oVirt** is installed (means **engine with at least one host**)
 - the **Cockpit** is installed **in version 133 or higher** on the oVirt host

        yum install cockpit cockpit-machines
     
     or check [http://cockpit-project.org/running.html](http://cockpit-project.org/running.html) for more details
     
 - Please note, **latest project features** might be available only with **latest Cockpit**:
 
     [https://copr.fedorainfracloud.org/coprs/g/cockpit/cockpit-preview/](https://copr.fedorainfracloud.org/coprs/g/cockpit/cockpit-preview/) 
 
 - When logged as the `root` user on the oVirt engine machine:

        engine-config -s CORSSupport=true # To turn on the CORS support for the REST API     
        engine-config -s CORSAllowDefaultOrigins=true  # To allow CORS for all configured hosts
        systemct restart ovirt-engine

## RPM Installation
The RPM builds are released on [Copr repository](https://copr.fedorainfracloud.org/coprs/mlibra/cockpit-machines-ovirt-provider/).
To enable it, use:

    dnf copr enable mlibra/cockpit-machines-ovirt-provider  

To install:

    dnf install cockpit-machines-ovirt-provider

## Development Build
If RPM installation is not enough and you are willing to build from sources, this section is for you.

### Dev Build Prerequisites
All JavaScript dependencies can be installed via `npm i` (see package.json file).
 
Anyway, it is **recommended** to use `yarn` and offline cache maintained by the ovirt-engine-nodejs-modules project since the project is tested against such "fixed" versions of 3rd party libraries.

To do so, enable the `tested` repository from

    http://resources.ovirt.org/repos/ovirt/tested/master/rpm
    
Until [BZ 1427045](https://bugzilla.redhat.com/show_bug.cgi?id=1427045) is finished, this step has to be done manually. 

To install all dependencies:

    git clone https://github.com/oVirt/cockpit-machines-ovirt-provider.git
    cd cockpit-machines-ovirt-provider
    ./autogen.sh
    yum-builddep cockpit-machines-ovirt-provider.spec  # to install ovirt-engine-yarn and other dependencies of correct versions
    source /usr/share/ovirt-engine-nodejs-modules/setup-env.sh  # to create ./node_modules dir from yarn offline cache

### Build

    make [rpm]
 
The result can be found under `dist` or `tmp.repos` directories.
  
### Development Build Installation
If the project is built from sources, it's enough to just copy `dist/` content under `[COCKPIT_INSTALL_DIR]/machines/provider`.

On an oVirt host machine:

    cd [COCKPIT_INSTALL_DIR]/machines
    mkdir -p ./provider
    cp [PROVIDER_SRC @ BUILD_MACHINE]/dist/* ./provider/
    # and just refresh the cockpit:machines page (press F5) to take effect
  
The `COCKPIT_INSTALL_DIR` usually refers to `/usr/share/cockpit`.

The `PROVIDER_SRC` refers to directory where you built the project (probably remote machine).
  
## Post install
Once either the RPM or from sources installation is finished, the plugin needs to do some additional configuration, like setting the URL of your oVirt engine.
 
To do so:

 - login into Cockpit as `root` user
 - enter the `machines` plugin, installation dialog pops-up
 - submit URL of your running **oVirt engine**
     - Example: `https://my.domain.com/ovirt-engine`      
     - following config files will be updated:
         - cockpit/machines/override.json
         - cockpit/machines/provider/machines-ovirt.config
     - in case of failure, please follow instructions by the `install.sh`        
 - as instructed on the screen, re-login into Cockpit
 
Cockpit does not need to be restarted to take effect, just log out/log in is enough.

# Invocation
If installed and configured properly, the oVirt will be used as datasource after next reload of the `machines` plugin page in Cockpit (re-login to Cockpit).

The provider supports oVirt SSO (see [2]), it means the user will be optionally redirected to oVirt login page and back to the Cockpit. 

# Actions
Data retrieval (means list of VMs and their properties) is intentionally handled still via Libvirt leading to host-local view on the system.

Active operations `(start, shutdown, restart)` are redirected to oVirt REST API to be performed.

  
# Links

- [1] Cockpit-machines external provider support
    - https://github.com/cockpit-project/cockpit/pull/5759
    - and multiple follow-up patches
- [2] oVirt CORS support
    - https://gerrit.ovirt.org/#/c/68529/
- [3] The rest is tracked on [oVirt Trello](https://trello.com/c/QXXB6SHu/8-cockpit-upstream-vm-management)

# To Be Done

- [1] ovirt-engine/web-ui/authorizedRedirect.jsp (part of ovirt-engine 4.1 from ovirt-web-ui.0.1.1-2.rpm) is used to handle SSO redirect. Recently considering moving this JSP under enginesso.war
  
# Author(s)
Please send author(s) any feedback on the project.
  
  - Marek Libra ([mlibra@redhat.com](mlibra@redhat.com))
 
