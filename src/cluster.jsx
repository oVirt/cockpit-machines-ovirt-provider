import { getReact } from './react.js';
import { logDebug, logError, toGigaBytes, valueOrDefault } from './helpers.js';

import OVIRT_PROVIDER from './provider';

const $ = window.$;
// const cockpit = window.cockpit;

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

  const NoVmUnitialized = () => { // TODO: improve
    return (<div>Please wait till VMs list is loaded from the server.</div>);
  };

  const VmHA = ({ highAvailability }) => (<div>{highAvailability ? (_("yes")) : (_("no"))}</div>);
  const VmMemory = ({ mem }) => (<div>{toGigaBytes(mem, 'B')} GB</div>);
  const VmCpu = ({ cpu }) => { // architecture? topology?
    const vCpus = valueOrDefault(cpu.topology.sockets, 1) * valueOrDefault(cpu.topology.cores, 1) * valueOrDefault(cpu.topology.threads, 1);
    const tooltip = `${_("sockets")}: ${cpu.topology.sockets}\n${_("cores")}: ${cpu.topology.cores}\n${_("threads")}: ${cpu.topology.threads}`;
    return (<span title={tooltip} data-toggle='tooltip' data-placement='left'>{vCpus}</span>);
  };
  const VmOS = ({ os }) => (<div>{os.type}</div>);
  const VmStateless = ({ stateless }) => (<div>{stateless}</div>);
  const VmHost = ({ id, hosts }) => {
    if (!id || !hosts || !hosts[id]) {
      return null; // not running or data load not yet finished
    }

    const host = hosts[id];
    const tooltip = `${_("address")}: ${host.address}`;
    return <span title={tooltip} data-toggle='tooltip' data-placement='left'>{host.name}</span>
  };
  const VmDescription = ({ descr }) => (<span>{descr}</span>); // cropping is not needed, the text wraps

  const Vm = ({ vm, hosts, config }) => {
    const stateIcon = (<StateIcon state={vm.state} config={config}/>);

    return (<ListingRow // TODO: icons? cluster? templates?
      columns={[
            {name: vm.name, 'header': true},
            <VmDescription descr={vm.description} />,
            <VmMemory mem={vm.memory} />,
            <VmCpu cpu={vm.cpu} />,
            <VmOS os={vm.os} />,
            <VmHA highAvailability={vm.highAvailability} />,
            <VmStateless stateless={vm.stateless} />,
            vm.origin,
            <VmHost id={vm.hostId} hosts={hosts} />,
            stateIcon
            ]}
      />);
  };

  const ClusterVms = ({ vms, hosts, dispatch, config }) => {
    if (!vms) { // before cluster vms are loaded ; TODO: better handle state for the user
      return (<NoVmUnitialized />);
    }

    if (vms.length === 0) { // there are no vms
      return (<NoVm />);
    }
/*
    id: vm.id,
      name: vm.name,
      state: mapOvirtStatusToLibvirtState(vm.status),
      description: vm.description,
      highAvailability: vm.high_availability,
      icons: {
      largeId: vm.large_icon ? vm.large_icon.id : undefined,
        smallId: vm.small_icon ? vm.small_icon.id : undefined,
    },
    memory: vm.memory,
      cpu: {
      architecture: vm.cpu.architecture,
        topology: {
        sockets: vm.cpu.topology.sockets,
          cores: vm.cpu.topology.cores,
          threads: vm.cpu.topology.threads
      }
    },
    origin: vm.origin,
      os: {
      type: vm.os.type
    },
    stateless: vm.stateless,
      clusterId: vm.cluster.id,
      templateId: vm.template.id,
      host: vm.host ? vm.host.id : undefined,
*/


    return (<div className='container-fluid'>
      <Listing title={_("Cluster Virtual Machines")} columnTitles={[
        _("Name"), _("Description"), _("Memory"), _("vCPUs"), _("OS"), _("HA"), _("Stateless"), _("Origin"), _("Host"), _("State")]}>
        {Object.getOwnPropertyNames(vms).map(vmId => {
          return (
            <Vm vm={vms[vmId]}
                hosts={hosts}
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
      return (<ClusterVms vms={providerState.vms} hosts={providerState.hosts} dispatch={dispatch} config={config} />);
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
