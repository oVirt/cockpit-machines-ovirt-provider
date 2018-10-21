import { getReact } from '../react.js';
import CONFIG from '../config.js'

import { logError } from '../helpers.js';
import { switchToplevelVisibility } from '../actions';

import ClusterComponents from './cluster.jsx';
import VdsmComponents from './vdsm.jsx';

const $ = window.$;

const _ = (m) => m; // TODO: add translation

const exportedComponents = {}; // to be filled by lazy created and exported components

/**
 * Add [ Host | Cluster | VDSM ] switch in the top-right corner
 */
export function appendClusterSwitch(store) {
  if (!store) {
    logError("Redux store is not provided, can't add the Cluster View");
    return ;
  }

  const { dispatch } = store;

  $('body').append( hostClusterSwitchHtml() );
  $('body').append( LoginInProgressHtml() );

  $("#ovirt-provider-toplevel-switch-host").on('click', () => dispatch(switchToplevelVisibility('hostView')));
  $("#ovirt-provider-toplevel-switch-cluster").on('click', () => dispatch(switchToplevelVisibility('clusterView')));
  $("#ovirt-provider-toplevel-switch-vdsm").on('click', () => dispatch(switchToplevelVisibility('vdsmView')));

  exportedComponents.renderOVirtView(store);
}

function LoginInProgressHtml() {
  if (CONFIG.token) {
    return '<div />';
  }

  return '<div class="ovirt-provider-login-in-progress">' +
    '<div class="spinner spinner-sm"/>' +
    `&nbsp;${_("oVirt authentication in progress ...")}` +
    '</div>';
}

export function toggleLoginInProgress() {
  console.log('toggleLoginInProgress() called');
  $(".ovirt-provider-login-in-progress").remove();
  if (!CONFIG.token) {
    console.log('toggleLoginInProgress() token not available');
    $('body').append( LoginInProgressHtml() );
  }
}

function hostClusterSwitchHtml() {
  return '<div class="ovirt-provider-toplevel-switch">' +
    `<a href="#" id="ovirt-provider-toplevel-switch-host">${_("Host")}</a>` +
    ' | ' +
    `<a href="#" id="ovirt-provider-toplevel-switch-cluster">${_("Cluster")}</a>` +
    ' | ' +
    `<a href="#" id="ovirt-provider-toplevel-switch-vdsm">${_("VDSM")}</a>` +
    '</div>';
}

export function highlightTopLevelSwitch(componentName) {
  const allSwitches = [
    '#ovirt-provider-toplevel-switch-host',
    '#ovirt-provider-toplevel-switch-cluster',
    '#ovirt-provider-toplevel-switch-vdsm',
  ]
  const open = [`#ovirt-provider-toplevel-switch-${componentName}`]
  const close = allSwitches.filter( item => open.indexOf(item) < 0 )

  open.forEach( item => $(item).addClass('ovirt-provider-topswitch-open'))
  close.forEach( item => $(item).removeClass('ovirt-provider-topswitch-open'))
}

export function lazyCreateOVirtView() {
  const React = getReact();
  if (!React) {
    logError(`lazyCreateOVirtView(): React not registered!`);
    return ;
  }

  const { ClusterView } = ClusterComponents;
  const { VdsmView } = VdsmComponents;

  /**
   * oVirt specific top-level component switch
   *
   * TODO: this will be adjusted once cockpit:machines gets support for switching top-level components
   */
  const OVirtView = ({ store }) => {
    const { config } = store.getState();
    const { providerState } = config;
    const dispatch = store.dispatch;

    if (!providerState || !providerState.visibility) {
      return (<div/>); // not yet initialized
    }

    // Hack to switch visibility of top-level components without parent cockpit:machines awareness
    if (providerState.visibility.clusterView) {
      $('#app').hide();
      return (
        <div>
          <ClusterView vms={providerState.vms}
                       hosts={providerState.hosts}
                       templates={providerState.templates}
                       clusters={providerState.clusters}
                       dispatch={dispatch}
                       config={config}
                       view={providerState.visibility.clusterView}/>
        </div>
      );
    } else if (providerState.visibility.vdsmView) {
      $('#app').hide();
      return (
        <div>
          <VdsmView dispatch={dispatch}/>
        </div>
      );
    }

    highlightTopLevelSwitch('host')
    $('#app').show(); // Host Vms List will be rendered by parent cockpit:machine
    return null;
  };

  /**
   * Hook rendering React to another placeholder.
   * Listens on store changes.
   * Exported.
   */
  const renderOVirtView = (store) => {
    $("body").append('<div id="app-cluster"></div>');
    const render = () => {
      const r = getReact();
      r.render(
        r.createElement(OVirtView, {store}),
        document.getElementById('app-cluster')
      )
    };
    store.subscribe(render);
    render();
  };

  exportedComponents.renderOVirtView = renderOVirtView;
}
