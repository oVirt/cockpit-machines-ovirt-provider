import { getReact } from './react.js';
import { logDebug, logError } from './helpers.js';

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

  const ClusterVms = ({ vms }) => {
    if (!vms) { // before cluster vms are loaded
      logDebug(`ClusterVms component: no vms provided`);
      return (<div/>);
    }

    return (<div>Cluster VMs: {JSON.stringify(vms)}</div>);
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
      return (<ClusterVms vms={providerState.vms}/>);
    }

    $('#app').show(); // Host Vms List will be rendered by parent cockpit:machine
    return null;
  };

  /**
   * Hook to render React to another placeholder.
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
