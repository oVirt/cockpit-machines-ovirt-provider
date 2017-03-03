*Please note:* `this code is still under development`

# oVirt External Prvider for Cockpit-machines
With this external provider, the `machines` plugin in Cockpit can redirect actions to oVirt REST API instead of default Libvirt.
 
# Cockpit-machines External Providers in general 
 Please refer to cockpit-machines [README.md](https://github.com/mareklibra/cockpit/blob/machines.providers/pkg/machines/README.md) for external plugin description and API which is implemented by this project.

 The entry point for the provider API implementation is `src/provider.js`.
 It's fine to implement the API using `VanillaJS`, as far as the simple API contract is met.
 
 For more complex scenarios `ES6, Babel, Webpack and React` can be leveraged as shown in this project. 

# Build
 
 - git clone https://github.com/mareklibra/cockpit-machines-ovirt-provider.git && cd cockpit-machines-ovirt-provider 
 - npm i
 - make
 
 The result can be found under `dist` directory.
 
# Installation
Please make sure the Cockpit is installed **including support for external providers [1]**.

- as `root` user on the host running the oVirt engine:
    - `engine-config -s CORSSupport=true` # To turn on the CORS support for the REST API     


- `cd [COCKPIT_INSTALL_DIR]/machines && mkdir -p ./provider`
- `cp [PROVIDER_SRC]/dist/* ./provider/`
- login into Cockpit as `root` user, enter the `machines` plugin, installation dialog pops-up. Please submit your URL of running oVirt engine 
    - will lead to creation/update of following config files:
        - cockpit/shell/override.json
        - cockpit/machines/override.json
        - cockpit/machines/provider/machines-ovirt.config
    - in case of failure, please follow instructions by the `install.sh`        
- re-login into Cockpit

The `COCKPIT_INSTALL_DIR` usually refers to `/usr/share/cockpit`.

The `PROVIDER_SRC` refers to directory where you git-clone this project.

Example of `ENGINE_URL`: https://my.domain.com/ovirt-engine

Cockpit does not need to be restarted to take effect.

# RPM Installation

**Will follow ...**

# Invocation
If installed properly, the oVirt will be used as datasource after next reload of the `machines` plugin page in Cockpit (re-login to Cockpit).

The provider supports oVirt SSO (see [2]), it means the user will be optionally redirected to oVirt login page and back to the Cockpit. 

# Actions
Data retrieval (means list of VMs and their properties) is intentionally handled still via Libvirt leading to host-local view on the system.

Active operations `(start, shutdown, restart)` are redirected to oVirt REST API to be performed.

  
# Links

- [1] Cockpit-machines external provider support
    - https://github.com/mareklibra/cockpit/tree/machines.providers
    - and multiple follow-up patches
- [2] oVirt CORS support
    - https://gerrit.ovirt.org/#/c/68529/
- [3] The rest is tracked on [oVirt Trello](https://trello.com/c/QXXB6SHu/8-cockpit-upstream-vm-management)

# To Be Done

- [1] ovirt-engine/web-ui/authorizedRedirect.jsp (part of ovirt-engine 4.1 from ovirt-web-ui.0.1.1-2.rpm) is used to handle SSO redirect. Recently considering moving this JSP under enginesso.war
  
# Author(s)
Please send author(s) any feedback on the project.
  
  - Marek Libra ([mlibra@redhat.com](mlibra@redhat.com))
 
