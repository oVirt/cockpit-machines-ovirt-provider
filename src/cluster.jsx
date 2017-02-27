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
    const tooltip = `${_("Address")}: ${host.address}`;
    return <span title={tooltip} data-toggle='tooltip' data-placement='left'>{host.name}</span>
  };
  const VmTemplate = ({ id, templates }) => {
    if (!id || !templates || !templates[id]) {
      return null; // not running or data load not yet finished
    }

    const template = templates[id];
    const baseTemplateName = template.version.baseTemplateId && templates[template.version.baseTemplateId] ? templates[template.version.baseTemplateId].name : '';
    const tooltip = `${_("Description")}: ${template.description}\n${_("Version")}: ${valueOrDefault(template.version.name, '')}\n${_("Version num")}: ${valueOrDefault(template.version.number, '')}\n${_("Base template")}: ${baseTemplateName}\n`;
    return <span title={tooltip} data-toggle='tooltip' data-placement='left'>{template.name}</span>
  };
  const VmDescription = ({ descr }) => (<span>{descr}</span>); // cropping is not needed, the text wraps

  const Vm = ({ vm, hosts, templates, config }) => {
    const stateIcon = (<StateIcon state={vm.state} config={config}/>);

    return (<ListingRow // TODO: icons? cluster? templates?
      columns={[
            {name: vm.name, 'header': true},
            <VmDescription descr={vm.description} />,
            <VmMemory mem={vm.memory} />,
            <VmTemplate id={vm.templateId} templates={templates} />,
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

  const ClusterVms = ({ vms, hosts, templates, dispatch, config }) => {
    if (!vms) { // before cluster vms are loaded ; TODO: better handle state for the user
      return (<NoVmUnitialized />);
    }

    if (vms.length === 0) { // there are no vms
      return (<NoVm />);
    }

    return (<div className='container-fluid'>
      <Listing title={_("Cluster Virtual Machines")} columnTitles={[
        _("Name"), _("Description"), _("Memory"), _("Template"), _("vCPUs"), _("OS"),
        _("HA"), _("Stateless"), _("Origin"), _("Host"), _("State")]}>
        {Object.getOwnPropertyNames(vms).map(vmId => {
          return (
            <Vm vm={vms[vmId]}
                hosts={hosts}
                templates={templates}
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
      return (<ClusterVms vms={providerState.vms} hosts={providerState.hosts} templates={providerState.templates}
                          dispatch={dispatch} config={config} />);
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
