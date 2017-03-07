import { getHostAddress, isSameHostAddress } from './helpers';

export function getCurrentHost (hosts) {
  const currentHostAddress = getHostAddress();
  const hostId = hosts.filter(hostId => currentHostAddress === hosts[hostId].address);
  return hostId ? hosts[hostId] : undefined;
}
