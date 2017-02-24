import { getReact } from './react.js';
import { logDebug, logError } from './helpers.js';

import OVIRT_PROVIDER from './provider';

const $ = window.$;
const cockpit = window.cockpit;

const _ = (m) => m; // TODO: add translation

const exportedComponents = {}; // to be filled by lazy created and exported components


/**
 * Build React components once the React context is available.
 */
export function lazyCreateClusterView() {
  const React = getReact();
  if (!React) {
    logError(`lazyCreateOVirtTab(): React not registered!`);
    return ;
  }

  const { Listing, ListingRow, StateIcon } = OVIRT_PROVIDER.parentReactComponents;

  const NoVm = () => {
    return (<div>
      TODO: Data retrieved, but no VM found in oVirt!
    </div>);
  };

  const NoVmUnitialized = () => { // TODO
    return (<div>Please wait till VMs list is loaded from the server.</div>);
  };

  const Vm = ({ vm, config }) => {
    const stateIcon = (<StateIcon state={vm.state} config={config}/>);

    return (<ListingRow
      columns={[
            {name: vm.name, 'header': true},
            stateIcon
            ]}
      />);
  };

  const ClusterVms = ({ vms, dispatch, config }) => {
    if (!vms) { // before cluster vms are loaded ; TODO: handle state
      return (<NoVmUnitialized />);
    }

    if (vms.length === 0) { // there are no vms
      return (<NoVm />);
    }

    return (<div className='container-fluid'>
      <Listing title={_("Cluster Virtual Machines")} columnTitles={[_("Name"), _("State")]}>
        {Object.getOwnPropertyNames(vms).map(vmId => {
          return (
            <Vm vm={vms[vmId]}
                config={config}
                dispatch={dispatch}
            />);
        })}
      </Listing>
    </div>);

//    return (<div>Cluster VMs: {JSON.stringify(vms)}</div>);
  };

  /**
   * Exported and top-level component.
   */
  const ClusterView = ({ store }) => {
    const { config } = store.getState();
    const { providerState } = config;
    const dispatch = store.dispatch;

    if (!providerState || !providerState.visibility) {
      return (<div/>); // not yet initialized
    }

    // Hack to switch visibility of top-level components without parent cockpit:machines awareness
    if (providerState.visibility.clusterView) {
      $('#app').hide();
      return (<ClusterVms vms={providerState.vms} config={config} />);
    }

    $('#app').show(); // Host Vms List will be rendered by parent cockpit:machine
    return null;
  };

  /**
   * Hook rendering React to another placeholder.
   * Listens on store changes.
   * Exported.
   */
  const renderClusterView = (store) => {
    $("body").append('<div id="app-cluster"></div>');
    const render = () => {
      React.render(
        React.createElement(ClusterView, {store}),
        document.getElementById('app-cluster')
      )
    };
    store.subscribe(render);
    render();
  };

  exportedComponents.ClusterView = ClusterView;
  exportedComponents.renderClusterView = renderClusterView;
}

export default exportedComponents;
