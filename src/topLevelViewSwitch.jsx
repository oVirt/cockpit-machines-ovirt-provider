import ClusterComponents from './cluster.jsx';
import { logError } from './helpers.js';
import { switchToplevelVisibility } from './actions';

const $ = window.$;

const _ = (m) => m; // TODO: add translation

/**
 * Add [ Host | Cluster ] switch in the top-right corner
 */
export function appendClusterSwitch(store) {
  if (!store) {
    logError("Redux store is not provided, can't add the Cluster View");
    return ;
  }

  const { dispatch } = store;

  $('body').append( hostClusterSwitchHtml() );
  $("#ovirt-provider-toplevel-switch-host").on('click', () => dispatch(switchToplevelVisibility('hostView')));
  $("#ovirt-provider-toplevel-switch-cluster").on('click', () => dispatch(switchToplevelVisibility('clusterView')));

  ClusterComponents.renderClusterView(store);
}

function hostClusterSwitchHtml() {
  return '<div class="ovirt-provider-toplevel-switch">' +
    `<a href="#" id="ovirt-provider-toplevel-switch-host">${_("Host")}</a>` +
    ' | ' +
    `<a href="#" id="ovirt-provider-toplevel-switch-cluster">${_("Cluster")}</a>` +
    '</div>';
}
