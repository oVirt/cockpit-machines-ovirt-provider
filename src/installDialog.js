import { logDebug, logError } from './helpers.js'
import { INSTALL_SCRIPT } from './config.js'

const $ = window.$;
const cockpit = window.cockpit;

const _ = (m) => m; // TODO: add translation

// Example how jQuery can be used to integrate with the parent cockpit:machines
export function showPluginInstallationDialog () {
  $("body").append(getInstallationDialogHtml());

  var deferred = cockpit.defer();
  $("#ovirt-provider-install-dialog-cancel").on("click", function() {
    deferred.reject();
  });
  $("#ovirt-provider-install-dialog-install-button").on("click", function() {
    var engineUrl = $("#ovirt-provider-install-dialog-engine-url").val()
    cockpit.spawn([INSTALL_SCRIPT, engineUrl], { "superuser": "try" })
      .done(function () {
        // $("#ovirt-provider-install-dialog").modal("hide");
        console.info('oVirt Provider installation script successful, logout required');

        // just reload window.top.location is not sufiecient since cockpit's configuration files were changed. The user is required to re-login
        // window.top.location.reload(true);
        $("#ovirt-provider-install-dialog-body").replaceWith( getLogoutConfirmationHtml() );
        $("#ovirt-provider-install-dialog-footer").replaceWith( getLogoutConfirmationFooterHtml() );
        $("#ovirt-provider-install-dialog-logout-button").on("click", function() {
          // TODO: why is nothing from following not working?
          // $("#go-logout", window.parent.document).trigger('click');
          // $("#navbar-dropdown", window.top.document).trigger('click');
          // cockpit.logout(true);

          // workiaround since auto-logout is not working
          $("body").append( getLogoutRequiredHtml() );
          deferred.resolve();
        });
      })
      .fail(function (ex, data) {
        logError('oVirt Provider installation script failed. Exception="'+JSON.stringify(ex)+'", output="'+JSON.stringify(data)+'"');

        // TODO: improve error messages based on process exit code instead of just forwarding error msgs
        var errMsg = _("oVirt Provider installation script failed with following output: ") + data;
        $("#ovirt-provider-install-dialog-error").html(errMsg);

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
    '<span class="pficon pficon-error-circle-o"></span>' +
    '<strong>' + _("Installation finished successfuly.") + '</strong>' + _(" Please <b>re-login</b> to take effect.")
  '</div>';
}
