#!/bin/bash
# Installation script of the cockpit-machines-ovirt-provider.
# Required to be called after RPM installation and before Cockpit Machines cockpit-machines-ovirt-provider is accessed.
#
# Main task: update configuration for Engine URL
# Reason: Engine URL can't be determined from the VDSM host automatically, so must be provided by user.
#
# How: 
#      update content-security-policy in the 'shell' and 'machines' Cockpit plugins
#      update cockpit-machines-ovirt-provider runtime configuration (to assemble oVirt REST API URL)
#
# Future plan:
#      This script will be automatically called during rpm installation once the ENGINE URL can be read on the VDSM host somehow.
#

function usage() {
  echo Usage: $0 '[ENGINE_URL]'
  echo Example: $0 https://engine.mydomain.com/ovirt-engine/
}

function checkParams() {
  if [ x$ENGINE_URL = x ] ; then
    usage
    exit 1
  fi
}

function unableToMergeShellOverride() {
  echo
  echo ERROR: The \'content-security-policy\' already exists in $1, unable to merge
  echo
  echo Please update the $1 manually by setting:
  echo '  '\"content-security-policy\": \"default-src \'self\'';frame-src '$ENGINE_URL\"
  echo Otherwise the oVirt Single Sign On will not work for the cockpit-machines-ovirt-provider
  exit 2
}

function generateProviderConfig() {
  CONFIG_FILE=`dirname "$0"`/machines-ovirt.config
  echo "{ \
      \"debug\": false, \
      \"OVIRT_BASE_URL\": \"$ENGINE_URL\" \
    }" > $CONFIG_FILE
  echo OK: $CONFIG_FILE generated
}

function updateShellManifest() {
  SHELL_OVERRIDE=`dirname "$0"`/../../shell/override.json
  if [ -f $SHELL_OVERRIDE ] ; then
    grep -iq 'content-security-policy' $SHELL_OVERRIDE
    if [ $? -ne 0 ] ; then
      echo OK: cockpit/shell/override.json exists and content-security-policy is missing, so the configuration will be merged
      cp $SHELL_OVERRIDE $SHELL_OVERRIDE.MachinesOvirtProvider.orig # backup
      sed -i '1h;1!H;$!d;g;s/\(.*\)}/\1,"content-security-policy": "default-src '"'self';frame-src $ENGINE_URL\" }/" $SHELL_OVERRIDE
    else
      unableToMergeShellOverride $SHELL_OVERRIDE 
    fi
  else
    echo "{ \
        \"content-security-policy\": \"default-src 'self';frame-src $ENGINE_URL\" \
      }" > $SHELL_OVERRIDE    
    echo OK: $SHELL_OVERRIDE generated
  fi
}

function updateMachinesManifest() {
  MACHINES_OVERRIDE=`dirname "$0"`/../override.json
  echo "{ \
      \"content-security-policy\": \"default-src 'self';connect-src 'self' ws: wss: $ENGINE_URL\" \
    }" > $MACHINES_OVERRIDE
  echo OK: $MACHINES_OVERRIDE generated
}

ENGINE_URL=$1
checkParams
updateMachinesManifest
generateProviderConfig

updateShellManifest
