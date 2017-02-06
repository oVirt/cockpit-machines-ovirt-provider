export function updateHost(host) {
  return {
    type: 'OVIRT_UPDATE_HOST',
    payload: host
  }
}

export function removeUnlistedHosts({allHostIds}) {
  return {
    type: 'OVIRT_REMOVE_UNLISTED_HOSTS',
    payload: {
      allHostIds
    }
  }
}
