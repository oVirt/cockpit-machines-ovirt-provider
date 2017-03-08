import { getReact } from '../react.js';
import { logDebug, logError, toGigaBytes, valueOrDefault, isSameHostAddress, getHostAddress } from '../helpers.js';
import { getCurrentHost } from '../selectors';
import CONFIG from '../config';
import { switchToplevelVisibility, startVm, createVm } from '../actions';

import ClusterVmsComponents from './clusterVms.jsx';
import OVIRT_PROVIDER from '../provider';

const _ = (m) => m; // TODO: add translation

const exportedComponents = {}; // to be filled by lazy created and exported components

/**
 * Build React components once the React context is available.
 */
export function lazyCreateClusterView() {
  const React = getReact();
  if (!React) {
    logError(`lazyCreateClusterView(): React not registered!`);
    return ;
  }

  const { Listing, ListingRow, StateIcon, DropdownButtons } = OVIRT_PROVIDER.parentReactComponents;
  const { ClusterVms } = ClusterVmsComponents;

  class CreateVmFromTemplate extends React.Component {
    constructor (props) {
      super(props);
      this.state = {
        enterDetails: false,
        vmName: '',
      };

      this.onDoCreateVm = this.onDoCreateVm.bind(this);
      this.onCreateVm = this.onCreateVm.bind(this);

      this.onVmNameChanged = this.onVmNameChanged.bind(this);
    }

    onCreateVm () {
      this.setState({ enterDetails: true, vmName: '' });
    }

    onVmNameChanged (e) {
      this.setState({ vmName: e.target.value })
    }

    onDoCreateVm () {
      logDebug(`onDoCreateVm: ${this.state.vmName}`);
      this.props.dispatch(createVm({
        templateName: this.props.template.name,
        clusterName: this.props.cluster.name,
        vm: { name: this.state.vmName }
      }));
      this.setState({ enterDetails: false, vmName: '' });
    }

    render () {
      if (this.state.enterDetails) {
        return (
          <div>
            <input className='form-control' type='text' placeholder={_("Enter New VM name")} value={this.state.vmName} onChange={this.onVmNameChanged} />
            <button onClick={this.onDoCreateVm} className='btn btn-default btn-danger'>{_("Create")}</button>
          </div>
        );
      }

      return (<button onClick={this.onCreateVm}>{_("Create VM")}</button>);
    }
  }

  const TemplateActions = ({ template, cluster, dispatch}) => {
    return (
      <span>
        <CreateVmFromTemplate template={template} cluster={cluster} dispatch={dispatch} />
        <VmLastMessage vm={template} />
      </span>);
  };

  const Template = ({ template, templates, cluster, dispatch }) => {
    return (<ListingRow
      columns={[
            {name: template.name, 'header': true},
            template.version.name,
            template.version.baseTemplateId ? (templates[template.version.baseTemplateId].name) : null,
            <VmDescription descr={template.description} />,
            <VmMemory mem={template.memory} />,
            <VmCpu cpu={template.cpu} />,
            <VmOS os={template.os} />,
            <VmHA highAvailability={template.highAvailability} />,
            <VmStateless stateless={template.stateless} />,
            <TemplateActions template={template} cluster={cluster} dispatch={dispatch} />
            ]}
    />);
  };

  const ClusterTemplates = ({ templates, hosts, clusters, dispatch }) => {
    if (!templates) { // before cluster templates are loaded ;
      // TODO: better handle state from the user perspective
      return (<NoTemplateUnitialized />);
    }

    if (templates.length === 0) { // there are no templates
      return (<NoTemplate />);
    }

    const myHost = getCurrentHost(hosts);
    const hostCluster = myHost && myHost.clusterId && clusters[myHost.clusterId] ? clusters[myHost.clusterId] : undefined;
    const cluster = { name: hostCluster ? hostCluster.name : 'Default' };

    return (<div className='container-fluid'>
      <Listing title={_("Cluster Templates")} columnTitles={[
        _("Name"), _("Version"), _("Base Template"), _("Description"), _("Memory"), _("vCPUs"), _("OS"),
        _("HA"), _("Stateless"), _("Action")]}>
        {Object.getOwnPropertyNames(templates).map(templateId => {
          return (
            <Template template={templates[templateId]}
                      templates={templates}
                      cluster={cluster}
                      dispatch={dispatch}
            />);
        })}
      </Listing>
    </div>);
  };

  const ClusterSubViewSelection = ({ dispatch }) => {
    return (
      <span className='ovirt-provider-sublevel-switch'>
        <a href='#' onClick={() => dispatch(switchToplevelVisibility('clusterView', 'machines'))}>{_("Machines")}</a>&nbsp;|&nbsp;
        <a href='#' onClick={() => dispatch(switchToplevelVisibility('clusterView', 'templates'))}>{_("Templates")}</a>
      </span>
    );
  };

  /**
   * Exported.
   *
   * Top-level component for the `Cluster` view.
   */
  exportedComponents.ClusterView = ({ vms, hosts, templates, clusters, dispatch, config, view }) => {
    return (
      <div>
        <ClusterSubViewSelection dispatch={dispatch} />
        {view.subview === 'templates'
          ? (<ClusterTemplates templates={templates} hosts={hosts} clusters={clusters} dispatch={dispatch} />)
          : (<ClusterVms vms={vms} hosts={hosts} templates={templates} clusters={clusters} dispatch={dispatch} config={config} />)
        }
      </div>
    );
  };
}

export default exportedComponents;
