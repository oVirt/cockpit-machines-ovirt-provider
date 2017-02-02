
// export const INSTALL_SCRIPT = '/usr/share/cockpit/machines/provider/install.sh'
export const INSTALL_SCRIPT = '/root/.local/share/cockpit/machines/provider/install.sh' // TODO: change it!

export const CONFIG_FILE_URL = 'provider/machines-ovirt.config'

const CONFIG = { // will be dynamically replaced by content of CONFIG_FILE_URL within OVIRT_PROVIDER.init()
  debug: true, // set to false to turn off the debug logging
  OVIRT_BASE_URL: 'https://engine.local/ovirt-engine',

  token: null,
}

export default CONFIG
