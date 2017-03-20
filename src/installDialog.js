import { logError } from './helpers.js'
import { INSTALL_SCRIPT } from './config.js'

const $ = window.$;
const cockpit = window.cockpit;

const _ = (m) => m; // TODO: add translation

const INSTALL_SH_ERRORS = {
  '1': _("oVirt Provider installation script failed due to missing arguments."),
  '2': _("oVirt Provider installation script failed: Existing 'cockpit/shell/override.json' file already contains conflicting 'content-security-policy' section. Manual merge is required.<br/>Please set <b>\"content-security-policy\": \"default-src 'self';frame-src [YOUR_ENGINE_URL]\"</b>"),
  '3': _("oVirt Provider installation script failed: Can't write to cockpit/machines/provider/machines-ovirt.config, try as root."),
  '4': _("oVirt Provider installation script failed: Can't write to cockpit/machines/override.json, try as root."),
  '5': _("oVirt Provider installation script failed: Can't write to cockpit/shell/override.json, try as root."),
  '6': _("oVirt Provider installation script failed: In already existing cockpit/shell/override.json file is missing 'content-security-policy', but merge failed, try as root."),
};

// Example how jQuery can be used to integrate with the parent cockpit:machines
export function showPluginInstallationDialog () {
  $("body").append(getInstallationDialogHtml());
  checkForRootUser();

  var deferred = cockpit.defer();
  $("#ovirt-provider-install-dialog-cancel").on("click", function() {
    deferred.reject();
  });
  $("#ovirt-provider-install-dialog-install-button").on("click", function() {
    var engineUrl = $("#ovirt-provider-install-dialog-engine-url").val()
    console.info(`About to call: '${INSTALL_SCRIPT} ${engineUrl}'`);
    cockpit.spawn([INSTALL_SCRIPT, engineUrl], { "superuser": "try" })
      .done(function () {
        // $("#ovirt-provider-install-dialog").modal("hide");
        console.info('oVirt Provider installation script successful, logout required');

        // just reload window.top.location is not sufiecient since cockpit's configuration files were changed. The user is required to re-login
        // window.top.location.reload(true);
        $("#ovirt-provider-install-dialog-body").replaceWith( getLogoutConfirmationHtml() );
        $("#ovirt-provider-install-dialog-footer").replaceWith( getLogoutConfirmationFooterHtml() );
        $("#ovirt-provider-install-dialog-logout-button").on("click", function() {
          // TODO: why is nothing from following working?
          // $("#go-logout", window.parent.document).trigger('click');
          // $("#navbar-dropdown", window.top.document).trigger('click');
          // cockpit.logout(true);

          // workaround since auto-logout is not working
          $("body").append( getLogoutRequiredHtml() );

          deferred.resolve();
        });
      })
      .fail(function (ex, data) {
        logError('oVirt Provider installation script failed. Exception="'+JSON.stringify(ex)+'", output="'+JSON.stringify(data)+'"');

        let errMsg = _("oVirt Provider installation script failed with following output: ") + data;
        // ex: {"problem":null,"exit_status":3,"exit_signal":null,"message":"/root/.local/share/cockpit/machines/provider/install.sh exited with code 3"}
        if (ex.exit_status) {
          errMsg = INSTALL_SH_ERRORS[ex.exit_status] || errMsg;
        }
        $("#ovirt-provider-install-dialog-error").html(`<p><span class="pficon pficon-warning-triangle-o"></span>&nbsp;${errMsg}</p>`);

        deferred.reject();
      });
  });

  $("#ovirt-provider-install-dialog").modal({keyboard: false});
  return deferred.promise;
}

function getInstallationDialogHtml() {
    return '<div class="modal" id="ovirt-provider-install-dialog" tabindex="-1" role="dialog" data-backdrop="static">' +
       '<div class="modal-dialog">' +
          '<div class="modal-content">' +
              '<div class="modal-header">' +
                  '<h4 class="modal-title">'+ _("Finish oVirt External Provider installation") + '</h4>' +
              '</div>' +
              '<div class="modal-body" id="ovirt-provider-install-dialog-body">' +
                  '<p>' + _("The oVirt External provider is installed but not yet configured. Please enter Engine URL.") + '</p>' +
                  '<div id="ovirt-provider-install-dialog-body-rootCheck"></div>' +
                  '<table class="form-table-ct">' +
                      '<tr>' +
                          '<td class="top"><label class="control-label" for="ovirt-provider-install-dialog-engine-url">Engine URL: </label></td>' +
                          '<td><input id="ovirt-provider-install-dialog-engine-url" class="form-control" type="text" placeholder="https://engine.mydomain.com/ovirt-engine/"></td>' +
                      '</tr>' +
                  '</table>' +
                  '<div id="ovirt-provider-install-dialog-error"></div>'+
              '</div>' +
              '<div class="modal-footer" id="ovirt-provider-install-dialog-footer">' +
                  '<button class="btn btn-default" id="ovirt-provider-install-dialog-cancel" data-dismiss="modal">' + _("Not now") + '</button>' +
                  '<button class="btn btn-primary" id="ovirt-provider-install-dialog-install-button">' + _("Install") + '</button>' +
              '</div>' +
          '</div>' +
      '</div>' +
    '</div>';
}

function checkForRootUser() {
  cockpit.user().done(user => {
    if (user.name !== 'root') {
      $("#ovirt-provider-install-dialog-body-rootCheck")
        .replaceWith(`<p>You are logged as <b>${user.name}</b>. Please note, following operation might fail, since <b>root</b> login might be required to access Cockpit's configuration files.</p>`);
    }
  });
}

function getLogoutConfirmationHtml() {
  return '<div class="modal-body" id="ovirt-provider-install-dialog-body">' +
      '<p><b>' + _("Installation finished successfuly.") + '</b></p>' +
      '<p>' + _("Cockpit's configuration scripts were changed, you need to <b>relogin</b> to take effect.") + '</p>' +
    '</div>' ;
}

function getLogoutConfirmationFooterHtml() {
  return '<div class="modal-footer" id="ovirt-provider-install-dialog-footer">' +
      '<button class="btn btn-default" id="ovirt-provider-install-dialog-logout-button" data-dismiss="modal">' + _("Ok") + '</button>' + // TODO: change to 'Logout' once cockpit.logout() works
    '</div>' ;
}

function getLogoutRequiredHtml() {
  return '<div class="alert alert-warning">' +
    '<span class="pficon pficon-warning-triangle-o"></span>' +
    '<strong>' + _("Installation finished successfuly.") + '</strong>' + _(" Please <b>re-login</b> to take effect.") +
  '</div>';
}
