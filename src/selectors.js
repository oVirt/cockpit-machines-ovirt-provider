import { getHostAddress } from './helpers';

export function getCurrentHost (hosts) {
  const currentHostAddress = getHostAddress();
  const hostId = Object.getOwnPropertyNames(hosts).filter(hostId => currentHostAddress === hosts[hostId].address);
  return hostId ? hosts[hostId] : undefined;
}

export function getAllIcons (state) {
  console.log('getAllIcons():', state);
  return state.config && state.config.providerState ? state.config.providerState.icons : {};
}
