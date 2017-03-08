import { getReact } from '../react.js';
import { logDebug, logError } from '../helpers.js';
import { VDSM_CONF_FILE } from '../config';

const _ = (m) => m; // TODO: add translation

const cockpit = window.cockpit;

const exportedComponents = {}; // to be filled by lazy created and exported components

/**
 * Build React components not before the React context is available.
 */
export function lazyCreateVdsmView() {
  const React = getReact();
  if (!React) {
    logError(`lazyCreateVdsmView(): React not registered!`);
    return;
  }

  /**
   * Editor for the vdsm.conf file.
   */
  class VdsmConf extends React.Component {
    constructor (props) {
      super(props)

      this.state = {
        fileContent: 'Loading data ...',
        changed: false,
        reloadConfirmation: false,
        saveConfirmation: false,
      };

      this.onSave = this.onSave.bind(this);
      this.onSaveConfirmed = this.onSaveConfirmed.bind(this);
      this.onSaveCanceled = this.onSaveCanceled.bind(this);

      this.onReload = this.onReload.bind(this);
      this.onReloadConfirmed = this.onReloadConfirmed.bind(this);
      this.onReloadCanceled = this.onReloadCanceled.bind(this);

      this.onEditorChange = this.onEditorChange.bind(this);
    }

    componentDidMount() {
      this.doReload();
    }

    componentWillUnmount() {
    }

    doReload () {
      cockpit.file(VDSM_CONF_FILE).read()
        .done( (content, tag) => {
          this.setState({ fileContent: content, changed: false });
        }).fail( (error) => { // TODO: more visible for the user
        logError(`Error reading ${VDSM_CONF_FILE}: ${JSON.stringify(error)}`);
      })
    }

    doSave () {
      cockpit.file(VDSM_CONF_FILE).replace(this.state.fileContent)
        .done( (tag) => {
          logDebug('Content of vdsm.conf replaced.')
          this.setState({ changed: false });
        }).fail( (error) => {
        logError(`Error writing ${VDSM_CONF_FILE}: ${JSON.stringify(error)}`);
      })
    }

    onSave () {this.setState({saveConfirmation: true});} // render confirmation buttons
    onSaveConfirmed () {this.doSave(); this.setState({saveConfirmation: false});}
    onSaveCanceled () {this.setState({saveConfirmation: false});}

    onReload () {this.setState({reloadConfirmation: true});} // render confirmation buttons
    onReloadConfirmed () {this.doReload(); this.setState({reloadConfirmation: false});}
    onReloadCanceled () {this.setState({reloadConfirmation: false});}

    onEditorChange (event) {this.setState({fileContent: event.target.value, changed: true});}

    render () {
      let reloadButton = (!this.state.reloadConfirmation)
        ? (<button className='btn btn-default' onClick={this.onReload}>{_("Reload")}</button>)
        : (<span>&nbsp;{_("Confirm reload:")}&nbsp;
              <button className='btn btn-danger btn-xs' onClick={this.onReloadConfirmed}>{_("OK")}</button>&nbsp;
              <button className='btn btn-primary btn-xs' onClick={this.onReloadCanceled}>{_("Cancel")}</button>
           </span>);

      let saveButton = (!this.state.saveConfirmation)
        ? (<button className='btn btn-default' onClick={this.onSave} disabled={!this.state.changed}>{_("Save")}</button>)
        : (<span>&nbsp;{_("Confirm save:")}&nbsp;
        <button className='btn btn-danger btn-xs' onClick={this.onSaveConfirmed}>{_("OK")}</button>&nbsp;
              <button className='btn btn-primary btn-xs' onClick={this.onSaveCanceled}>{_("Cancel")}</button>
           </span>);

      return (
        <div className='ovirt-provider-vdsm'>
          <h1>{_("Edit the vdsm.conf")}</h1>

          <a href='/system/services#/vdsmd.service' target='_top'>
            {_("VDSM Service Management")}
          </a>

          <div className='ovirt-provider-vdsm-menu'>
            <div className="ovirt-provider-vdsm-inline-block"></div>
            <div className='btn-group ovirt-provider-vdsm-menu-buttons'>
              {saveButton}
              {reloadButton}
            </div>
          </div>

          <br/>
          <textarea className='ovirt-provider-vdsm-editor' value={this.state.fileContent}
                    onChange={this.onEditorChange}/>
        </div>
      );

    }
  }

  const VdsmView = ({}) => {
    return (<div>
      <VdsmConf />
    </div>);
  };

  exportedComponents.VdsmView = VdsmView;
}

export default exportedComponents;
