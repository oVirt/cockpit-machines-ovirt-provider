import { lazyCreateOVirtTab } from './components/hostVmsTabs.jsx';
import { lazyCreateVdsmView } from './components/vdsm.jsx';
import { lazyCreateClusterVms } from './components/clusterVms.jsx';
import { lazyCreateClusterTemplates } from './components/clusterTemplates.jsx';
import { lazyCreateClusterView } from './components/cluster.jsx';
import { lazyCreateOVirtView } from './components/topLevelViewSwitch.jsx';
import { lazyCreateVmDisksComponents } from './components/vmDisksSubtab.jsx';
import { lazyCreateCommonComponents } from './components/commonComponents.jsx';
import { lazyCreateVmProviderComponents } from './components/vmProviderActions.jsx';

export function lazyCreateReactComponents () {
  lazyCreateCommonComponents();
  lazyCreateOVirtTab();
  lazyCreateVdsmView();
  lazyCreateClusterVms();
  lazyCreateClusterTemplates();
  lazyCreateClusterView();
  lazyCreateVmDisksComponents();
  lazyCreateOVirtView();
  lazyCreateVmProviderComponents();
}
