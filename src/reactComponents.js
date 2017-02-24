import { lazyCreateOVirtTab } from './hostVmsTabs.jsx';
import { lazyCreateClusterView } from './cluster.jsx';

export function lazyCreateReactComponents () {
  lazyCreateOVirtTab();
  lazyCreateClusterView();
  // TODO: call other lazy creators
}
