import { lazyCreateOVirtTab } from './components/hostVmsTabs.jsx';
import { lazyCreateVdsmView } from './components/vdsm.jsx';
import { lazyCreateClusterView } from './components/cluster.jsx';
import { lazyCreateOVirtView } from './components/topLevelViewSwitch.jsx';
import { lazyCreateVmDisksComponents } from './components/vmDisksSubtab.jsx';

export function lazyCreateReactComponents () {
  lazyCreateOVirtTab();
  lazyCreateVdsmView();
  lazyCreateClusterView();
  lazyCreateVmDisksComponents();
  lazyCreateOVirtView();
}
