*Please note:* `this code is still under development`

# oVirt External Prvider for Cockpit-machines
With this external provider, the `machines` plugin in Cockpit can redirect actions to oVirt REST API instead of default Libvirt.
 
# Cockpit-machines External Providers in general 
 Please refer to cockpit-machines [README.md](https://github.com/mareklibra/cockpit/blob/machines.providers/pkg/machines/README.md) for external plugin description.

# Installation
Please make sure the Cockpit is installed **including support for external providers [1]**.

- `cd [COCKPIT_INSTALL_DIR]/machines && mkdir ./provider`
- `cp [PROVIDER_SRC]/src/* ./provider/`
- invoke `./provider/install.sh [ENGINE_URL]` 
    - leads to creation/update of following config files:
        - cockpit/shell/override.json
        - cockpit/machines/override.json
        - cockpit/machines/provider/machines-ovirt.config
    - in case of failure, please follow instructions by the `install.sh`        
- as root, on host running the oVirt engine:
    - `engine-config -s CORSSupport=true` # To turn on the CORS support for the REST API     

The `COCKPIT_INSTALL_DIR` usually refers to `/usr/share/cockpit`.

The `PROVIDER_SRC` refers to directory where you git-clone this project.

Example of `ENGINE_URL`: https://my.domain.com/ovirt-engine

Cockpit does not need to be restarted to take effect.

# Invocation
If installed properly, the oVirt will be leveraged after next reload of the `machines` plugin page in oVirt (re-login or refresh the page).

The provider supports oVirt SSO (see [2]).
The user will be optionally redirected to oVirt login page and back to the Cockpit. 

# Actions
Data retrieval (means list of VMs and their properties) is handled still via Libvirt.

Active operations `(start, shutdown, restart)` are redirected to oVirt REST API to be performed.

  
# To Be Done

- [1] Cockpit-machines external provider support
    - open & merge cockpit-project upstream pull request
    - https://github.com/mareklibra/cockpit/tree/machines.providers
- [2] oVirt CORS support
    - https://gerrit.ovirt.org/#/c/68529/
    - or workaround till it's merged: `engine-config -s 'CORSAllowedOrigins=*'`
- [3] The rest is tracked on [oVirt Trello](https://trello.com/c/QXXB6SHu/8-cockpit-upstream-vm-management)
- [4] ovirt-engine/web-ui/authorizedRedirect.jsp (part of ovirt-engine 4.1 from ovirt-web-ui.0.1.1-2.rpm) is used to handle SSO redirect. Recently considering moving this JSP under enginesso.war
  
# Author(s)
Please send author(s) any feedback on the project.
  
  - Marek Libra ([mlibra@redhat.com](mlibra@redhat.com))
 