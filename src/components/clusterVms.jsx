import { getReact } from '../react.js';
import { logError, toGigaBytes, valueOrDefault, isSameHostAddress, getHostAddress } from '../helpers.js';
import CONFIG from '../config';
import { switchToplevelVisibility, startVm } from '../actions';

import OVIRT_PROVIDER from '../provider';

const _ = (m) => m; // TODO: add translation

const exportedComponents = {}; // to be filled by lazy created and exported components

/**
 * Build React components once the React context is available.
 */
export function lazyCreateClusterVms() {
  const React = getReact();
  if (!React) {
    logError(`lazyCreateClusterVms(): React not registered!`);
    return;
  }

  const { Listing, ListingRow, StateIcon, DropdownButtons } = OVIRT_PROVIDER.parentReactComponents;

  const NoVm = () => (<div>TODO: Data retrieved, but no VM found in oVirt!</div>);
  const NoVmUnitialized = () => (<div>Please wait till VMs list is loaded from the server.</div>);

  const VmHA = ({ highAvailability }) => (<div>{highAvailability ? (_("yes")) : (_("no"))}</div>);
  const VmMemory = ({ mem }) => (<div>{toGigaBytes(mem, 'B')} GB</div>);
  const VmOS = ({ os }) => (<div>{os.type}</div>);
  const VmStateless = ({ stateless }) => (<div>{stateless}</div>);
  const VmDescription = ({ descr }) => (<span>{descr}</span>); // cropping is not needed, the text wraps

  const VmCpu = ({ cpu }) => { // architecture? topology?
    const vCpus = valueOrDefault(cpu.topology.sockets, 1) * valueOrDefault(cpu.topology.cores, 1) * valueOrDefault(cpu.topology.threads, 1);
    const tooltip = `${_("sockets")}: ${cpu.topology.sockets}\n${_("cores")}: ${cpu.topology.cores}\n${_("threads")}: ${cpu.topology.threads}`;
    return (<span title={tooltip} data-toggle='tooltip' data-placement='left'>{vCpus}</span>);
  };

  const VmHost = ({ id, hosts, dispatch }) => {
    if (!id || !hosts || !hosts[id]) {
      return null; // not running or data load not yet finished
    }
    const host = hosts[id];
    if (isSameHostAddress(host.address)) {
      return (<a href='#' onClick={() => dispatch(switchToplevelVisibility('hostView'))}>{host.name}</a>);
    }

    const cockpitUrl = `https://${host.address}:${CONFIG.cockpitPort}/machines`;
    // just the <a href> without the onClick handler is not working
    return (<a href={cockpitUrl} onClick={() => {window.top.location=cockpitUrl;}}>
      {host.name}
    </a>);
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

  const VmActions = ({ vm, hostName, dispatch }) => {
    if (['shut off', 'down'].indexOf(vm.state) >= 0) {
      // TODO: disable the button after execution, reenable at next refresh
      return (<span>
        <DropdownButtons buttons={
          [{
              title: _("Run"),
              action: () => dispatch(startVm(vm)),
              id: `cluster-${vm.id}-run`
            }, {
              title: _("Run Here"),
              action: () => dispatch(startVm(vm, hostName)),
              id: `cluster-${vm.id}-run-here`
            }]
          } />
        <VmLastMessage vm={vm}/>
        </span>);
    }
    return null;
  };

  const VmCluster = ({ id, clusters }) => {
    if (!id || !clusters || !clusters[id]) {
      return null;
    }
    return (
      <div>
        {clusters[id].name}
      </div>
    );
  };

  const VmLastMessage = ({ vm }) => {
    if (!vm.lastMessage) {
      return null;
    }
    const detail = (vm.lastMessageDetail && vm.lastMessageDetail.exception) ? vm.lastMessageDetail.exception: vm.lastMessage;
    return (
      <p title={detail} data-toggle='tooltip'>
        <span className='pficon-warning-triangle-o' />&nbsp;{vm.lastMessage}
      </p>
    );
  };

  const Vm = ({ vm, hosts, templates, clusters, config, dispatch }) => {
    const stateIcon = (<StateIcon state={vm.state} config={config}/>);

    const hostAddress = getHostAddress();
    const hostId = Object.getOwnPropertyNames(hosts).find(hostId => hosts[hostId].address === hostAddress);
    const hostName = hostId && hosts[hostId] ? hosts[hostId].name : undefined;

    return (<ListingRow // TODO: icons?
      columns={[
            {name: vm.name, 'header': true},
            <VmDescription descr={vm.description} />,
            <VmCluster id={vm.clusterId} clusters={clusters} />,
            <VmTemplate id={vm.templateId} templates={templates} />,
            <VmMemory mem={vm.memory} />,
            <VmCpu cpu={vm.cpu} />,
            <VmOS os={vm.os} />,
            <VmHA highAvailability={vm.highAvailability} />,
            <VmStateless stateless={vm.stateless} />,
            vm.origin,
            <VmHost id={vm.hostId} hosts={hosts} dispatch={dispatch} />,
            <VmActions vm={vm} dispatch={dispatch} hostName={hostName} />,
            stateIcon
            ]}
    />);
  };

  const ClusterVms = ({ vms, hosts, templates, clusters, dispatch, config }) => {
    if (!vms) { // before cluster vms are loaded ; TODO: better handle state from the user perspective
      return (<NoVmUnitialized />);
    }

    if (vms.length === 0) { // there are no vms
      return (<NoVm />);
    }

    return (<div className='container-fluid'>
      <Listing title={_("Cluster Virtual Machines")} columnTitles={[
        _("Name"), _("Description"), _("Cluster"), _("Template"), _("Memory"), _("vCPUs"), _("OS"),
        _("HA"), _("Stateless"), _("Origin"), _("Host"),
        (<div className='ovirt-provider-cluster-vms-actions'>{_("Action")}</div>),
        _("State")]}>
        {Object.getOwnPropertyNames(vms).map(vmId => {
          return (
            <Vm vm={vms[vmId]}
                hosts={hosts}
                templates={templates}
                clusters={clusters}
                config={config}
                dispatch={dispatch}
            />);
        })}
      </Listing>
    </div>);
  };

  exportedComponents.ClusterVms = ClusterVms;
  exportedComponents.VmLastMessage = VmLastMessage;
  exportedComponents.VmDescription = VmDescription;
  exportedComponents.VmMemory = VmMemory;
  exportedComponents.VmCpu = VmCpu;
  exportedComponents.VmOS = VmOS;
  exportedComponents.VmHA = VmHA;
  exportedComponents.VmStateless = VmStateless;
}

export default exportedComponents;
