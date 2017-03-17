#!/bin/bash
# Installation script of the cockpit-machines-ovirt-provider.
# Required to be called after RPM installation and before Cockpit Machines cockpit-machines-ovirt-provider is accessed.
#
# Main task: update configuration files for Engine URL
# Reason: Engine URL can't be determined from the VDSM host automatically, so it must be provided by user.
#
# How: 
#      update content-security-policy in the 'shell' and 'machines' Cockpit plugins
#      update cockpit-machines-ovirt-provider runtime configuration (to assemble oVirt REST API URL)
#
# When:
#      either manually after rpm installations as root:
#         # cd [INSTALL_DIR] && ./install.sh https://[ENGINE_HOST]/ovirt-engine/
#      or
#         login into cockpit as the 'root' user
#         access the 'machines' plugin
#         installation dialog shows up to handle the install.sh script execution from UI
#

ENGINE_URL=$1
COCKPIT_DIR=${2:-/usr/share/cockpit}  # TODO: get it dynamically via 'rpm -q cockpit-shell --fileprovide' or 'dpkg -L'

EXIT_PARAMS=1 # wrong command parameters
EXIT_CSP_IN_SHELL_OVERRIDE=2 # cockpit/shell/override.json exists and already contains conflicting 'content-security-policy' section. Manual merge is required.
EXIT_NO_ACCESS_MACHINES_OVIRT_CONFIG=3 # can't write to cockpit/machines/provider/machines-ovirt.config, try as root
EXIT_NO_ACCESS_MACHINES_OVERRIDE=4 # can't write to cockpit/machines/override.json
EXIT_NO_ACCESS_SHELL_OVERRIDE=5 # can't write to cockpit/shell/override.json
EXIT_SHELL_OVERRIDE_MERGE_FAILED=6 # cockpit/shell/override.json exists and the 'content-security-policy' is not present. Update of the file failed, try as root.

function usage() {
  echo Usage: $0 '[ENGINE_URL] [[COCKPIT_INSTLLATION_DIR]]'
  echo Example: $0 https://engine.mydomain.com/ovirt-engine/
  echo Example: $0 https://engine.mydomain.com/ovirt-engine/ /usr/share/cockpit
}

function checkParams() {
  if [ x${ENGINE_URL} = x ] ; then
    usage
    exit ${EXIT_PARAMS}
  else
    echo Registering for ENGINE_URL: $ENGINE_URL
  fi
}

function unableToMergeShellOverride() {
  echo
  echo ERROR: The \'content-security-policy\' already exists in $1, unable to merge
  echo
  echo Please update the $1 manually by setting:
  echo '  '\"content-security-policy\": \"default-src \'self\'';frame-src '$ENGINE_URL\"
  echo Otherwise the oVirt Single Sign On will not work for the cockpit-machines-ovirt-provider
  exit ${EXIT_CSP_IN_SHELL_OVERRIDE}
}

function generateProviderConfig() {
  CONFIG_FILE=${COCKPIT_DIR}/machines/provider/machines-ovirt.config

  echo "{ \
      \"debug\": false, \
      \"ovirt_polling_interval\": 60000, \
      \"cockpitPort\": 9090, \
      \"OVIRT_BASE_URL\": \"$ENGINE_URL\" \
    }" > $CONFIG_FILE || exit ${EXIT_NO_ACCESS_MACHINES_OVIRT_CONFIG}

  echo OK: ${CONFIG_FILE} generated
}

function updateShellManifest() {
  #SHELL_OVERRIDE=$(dirname $(dirname ${SCRIPT_DIR}))/shell/override.json
  SHELL_OVERRIDE=${COCKPIT_DIR}/shell/override.json
  if [ -f ${SHELL_OVERRIDE} ] ; then
    grep -iq 'content-security-policy' ${SHELL_OVERRIDE}
    if [ $? -ne 0 ] ; then
      echo OK: cockpit/shell/override.json exists and content-security-policy is missing, so the configuration will be merged
      cp ${SHELL_OVERRIDE} ${SHELL_OVERRIDE}.MachinesOvirtProvider.orig # backup
      sed -i '1h;1!H;$!d;g;s/\(.*\)}/\1,"content-security-policy": "default-src '"'self';frame-src ${ENGINE_URL}\" }/" ${SHELL_OVERRIDE} || exit ${EXIT_SHELL_OVERRIDE_MERGE_FAILED}
    else
      unableToMergeShellOverride ${SHELL_OVERRIDE}
    fi
  else
    echo "{ \
        \"content-security-policy\": \"default-src 'self';frame-src $ENGINE_URL\" \
      }" > ${SHELL_OVERRIDE} || exit ${EXIT_NO_ACCESS_SHELL_OVERRIDE}
    echo OK: ${SHELL_OVERRIDE} generated
  fi
}

function updateMachinesManifest() {
  #MACHINES_OVERRIDE=$(dirname ${SCRIPT_DIR})/override.json
  MACHINES_OVERRIDE=${COCKPIT_DIR}/machines/override.json
  echo "{ \
      \"content-security-policy\": \"default-src 'self' 'unsafe-inline' 'unsafe-eval' data:;connect-src 'self' ws: wss: $ENGINE_URL\" \
    }" > ${MACHINES_OVERRIDE} || exit ${EXIT_NO_ACCESS_MACHINES_OVERRIDE}
  echo OK: ${MACHINES_OVERRIDE} generated
}

checkParams

ENGINE_URL=$(echo "${ENGINE_URL}"|sed 's/\/$//g')
ENGINE_URL=${ENGINE_URL}"/"

updateMachinesManifest
generateProviderConfig

# updateShellManifest  # seems to be not needed
