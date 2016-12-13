/*
TODO:
 [root@engine engine-config]# engine-config -s CORSSupport=true
 [root@engine engine-config]# engine-config -s 'CORSAllowedOrigins=*' # or more particular

  ovirt-engine: CORS filter: use dynamic list of hosts

  replace in manifest.json: "content-security-policy": "default-src * 'unsafe-inline' 'unsafe-eval';connect-src https://engine.local;"

 https://192.168.122.101:9090/machines#token=TOKEN
 https://engine.local/ovirt-engine/web-ui/authorizedRedirect.jsp?redirectUrl=https://192.168.122.101:9090/machines#token=TOKEN

 encoded url:
 https://engine.local/ovirt-engine/web-ui/authorizedRedirect.jsp?redirectUrl=https%3A%2F%2F192.168.122.101%3A9090%2Fmachines%23token%3DTOKEN
 */

// TODO: read dynamically from config file
var CONFIG = {
    debug: true, // set to false to tunrn off debug logging
    OVIRT_BASE_URL: 'https://engine.local/ovirt-engine',
};

function logDebug (msg) {
    if (CONFIG.debug) {
        console.log('OVIRT_PROVIDER: ' + msg);
    }
}

function logError (msg) {
    console.error('OVIRT_PROVIDER: ' + msg);
}

var OVIRT_LOGIN = {
    token: undefined
};

var OVIRT_PROVIDER = {
    name: 'oVirt',
    _login (baseUrl) {
        var location = window.location;
        var tokenStart = location.hash.indexOf("token=");
        if (tokenStart >= 0) {
            var token = location.hash.substr(tokenStart + "token=".length);
            logDebug("_login(): token found in params: " + token);
            OVIRT_LOGIN.token = token;
            return true;
        } else { // TODO: redirect to SSO is not working because of CSP
/*            // redirect to oVirt's SSO
            var url = baseUrl + '/web-ui/authorizedRedirect.jsp?redirectUrl=' + location + '#token=TOKEN';
            logDebug("_login(): missing oVirt SSO token, redirecting to SSO: " + url);
            window.location = url;
            */
            logError('SSO token is not provided!');
        }
        return false;
    },

    /**
     * Initialize the Provider
     */
    init () {
        logDebug('init() called');
        return OVIRT_PROVIDER._login(CONFIG.OVIRT_BASE_URL);
    },

    GET_VM ({ lookupId: name }) {
/*        logDebug(`${this.name}.GET_VM()`);

        return dispatch => {
            if (!isEmpty(name)) {
                return spawnVirshReadOnly('dumpxml', name).then(domXml => {
                    parseDumpxml(dispatch, domXml);
                    return spawnVirshReadOnly('dominfo', name);
                }).then(domInfo => {
                    if (isRunning(parseDominfo(dispatch, name, domInfo))) {
                        return spawnVirshReadOnly('dommemstat', name);
                    }
                }).then(dommemstat => {
                    if (dommemstat) { // is undefined if vm is not running
                        parseDommemstat(dispatch, name, dommemstat);
                        return spawnVirshReadOnly('domstats', name);
                    }
                }).then(domstats => {
                    if (domstats) {
                        parseDomstats(dispatch, name, domstats);
                    }
                }); // end of GET_VM return
            }
        };
        */
    },

    /**
     * Initiate read of all VMs
     */
    GET_ALL_VMS () {
        logDebug('GET_ALL_VMS() called');
        return dispatch => {
            $.ajax({
                method: 'GET',
                headers: {
                    'Accept': 'application/json',
                    'Content-Type': 'application/xml',
                    'Authorization': 'Bearer ' + OVIRT_LOGIN.token
                },
                url: CONFIG.OVIRT_BASE_URL + '/api/vms'
            }).done(data => {
                logDebug('GET_ALL_VMS successful: ' + JSON.stringify(data));// TODO
            }).fail(data => {
                logError('GET_ALL_VMS failed: ' + data);
            });
        };
/*        return dispatch => {
            spawnScript({
                script: `virsh ${VMS_CONFIG.Virsh.ConnectionParams.join(' ')} -r list --all | awk '$1 == "-" || $1+0 > 0 { print $2 }'`
            }).then(output => {
                const vmNames = output.trim().split(/\r?\n/);
                vmNames.forEach((vmName, index) => {
                    vmNames[index] = vmName.trim();
                });
                logDebug(`GET_ALL_VMS: vmNames: ${JSON.stringify(vmNames)}`);

                // remove undefined domains
                dispatch(deleteUnlistedVMs(vmNames));

                // read VM details
                return cockpit.all(vmNames.map((name) => dispatch(getVm(name))));
            }).then(() => {
                // keep polling AFTER all VM details have been read (avoid overlap)
                dispatch(delayPolling(getAllVms()));
            });
        };
        */
    },

    SHUTDOWN_VM ({ name }) {
        /*
        logDebug(`${this.name}.SHUTDOWN_VM(${name}):`);
        return spawnVirsh('SHUTDOWN_VM', 'shutdown', name);
        */
    },

    FORCEOFF_VM ({ name }) {
        /*
        logDebug(`${this.name}.FORCEOFF_VM(${name}):`);
        return spawnVirsh('FORCEOFF_VM', 'destroy', name);
        */
    },

    REBOOT_VM ({ name }) {
        /*
        logDebug(`${this.name}.REBOOT_VM(${name}):`);
        return spawnVirsh('REBOOT_VM', 'reboot', name);
        */
    },

    FORCEREBOOT_VM ({ name }) {
        /*
        logDebug(`${this.name}.FORCEREBOOT_VM(${name}):`);
        return spawnVirsh('FORCEREBOOT_VM', 'reset', name);
        */
    },

    START_VM ({ name }) {
        /*
        logDebug(`${this.name}.START_VM(${name}):`);
        return spawnVirsh('START_VM', 'start', name);
        */
    }
};

function init () {
    console.log('Registering oVirt provider');
    window.EXTERNAL_PROVIDER = OVIRT_PROVIDER;
}

init();
