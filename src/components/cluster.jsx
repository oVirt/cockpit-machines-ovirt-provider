import { getReact } from '../react.js';
import { logError } from '../helpers.js';
import { switchToplevelVisibility } from '../actions';

import ClusterVmsComponents from './clusterVms.jsx';
import ClusterTemplateComponents from './clusterTemplates.jsx';
import { highlightTopLevelSwitch } from './topLevelViewSwitch.jsx'

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

  const { ClusterVms } = ClusterVmsComponents;
  const { ClusterTemplates } = ClusterTemplateComponents;

  const ClusterSubViewSelection = ({ dispatch, open }) => {
    return (
      <span className='ovirt-provider-sublevel-switch'>
        <a href='#' onClick={() => dispatch(switchToplevelVisibility('clusterView', 'machines'))} className={!open || open === 'machines' ? 'ovirt-provider-topswitch-subview-open' : ''}>
          {_("Machines")}</a>
        &nbsp;|&nbsp;
        <a href='#' onClick={() => dispatch(switchToplevelVisibility('clusterView', 'templates'))} className={open === 'templates' ? 'ovirt-provider-topswitch-subview-open' : ''}>
          {_("Templates")}
        </a>
      </span>
    );
  };

  /**
   * Exported.
   *
   * Top-level component for the `Cluster` view.
   */
  exportedComponents.ClusterView = ({ vms, hosts, templates, clusters, dispatch, config, view }) => {
    highlightTopLevelSwitch('cluster')

    return (
      <div>
        <ClusterSubViewSelection dispatch={dispatch} open={view.subview} />
        {view.subview === 'templates'
          ? (<ClusterTemplates templates={templates} hosts={hosts} clusters={clusters} dispatch={dispatch} />)
          : (<ClusterVms vms={vms} hosts={hosts} templates={templates} clusters={clusters} dispatch={dispatch} config={config} />)
        }
      </div>
    );
  };
}

export default exportedComponents;
