import { lazyCreateOVirtTab } from './hostVmsTabs.jsx';
import { lazyCreateVdsmView } from './vdsm.jsx';
import { lazyCreateClusterView } from './cluster.jsx';
import { lazyCreateOVirtView } from './topLevelViewSwitch.jsx';

export function lazyCreateReactComponents () {
  lazyCreateOVirtTab();

  lazyCreateVdsmView();
  lazyCreateClusterView();

  lazyCreateOVirtView();
}
