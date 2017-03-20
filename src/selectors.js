import { getHostAddress } from './helpers';

export function getCurrentHost (hosts) {
  const currentHostAddress = getHostAddress();
  const hostId = Object.getOwnPropertyNames(hosts).filter(hostId => currentHostAddress === hosts[hostId].address);
  return hostId ? hosts[hostId] : undefined;
}
