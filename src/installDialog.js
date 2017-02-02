import { logDebug, logError } from './helpers.js'

const $ = window.$;
const cockpit = window.cockpit;

// const INSTALL_SCRIPT = '/usr/share/cockpit/machines/provider/install.sh'
const INSTALL_SCRIPT = '/root/.local/share/cockpit/machines/provider/install.sh' // TODO: change it!

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
        $("#ovirt-provider-install-dialog").modal("hide");
        logDebug('oVirt Provider installation script successful');
        window.top.location.reload(true);
        // window.location.reload(true);
        deferred.resolve()
      })
      .fail(function (ex, data) {
        logError('oVirt Provider installation script failed. Exception="'+JSON.stringify(ex)+'", output="'+JSON.stringify(data)+'"');

        var errMsg = "oVirt Provider installation script failed with following output: " + data;
        $("#ovirt-provider-install-dialog-error").html(errMsg);

        deferred.reject();
      });
  });

  $("#ovirt-provider-install-dialog").modal({keyboard: false});
  return deferred.promise;
}

// TODO: use React
function getInstallationDialogHtml() {
    return '<div class="modal" id="ovirt-provider-install-dialog" tabindex="-1" role="dialog" data-backdrop="static">' +
       '<div class="modal-dialog">' +
          '<div class="modal-content">' +
              '<div class="modal-header">' +
                  '<h4 class="modal-title">Finish oVirt External Provider installation</h4>' +
              '</div>' +
              '<div class="modal-body">' +
                  '<p>The oVirt External provider is installed but not yet configured. Please enter Engine URL.</p>' +
                  '<table class="form-table-ct">' +
                      '<tr>' +
                          '<td class="top"><label class="control-label" for="ovirt-provider-install-dialog-engine-url">Engine URL: </label></td>' +
                          '<td><input id="ovirt-provider-install-dialog-engine-url" class="form-control" type="text" placeholder="https://engine.mydomain.com/ovirt-engine/"></td>' +
                      '</tr>' +
                  '</table>' +
                  '<div id="ovirt-provider-install-dialog-error"></div>'+
              '</div>' +
              '<div class="modal-footer">' +
                  '<button class="btn btn-default" id="ovirt-provider-install-dialog-cancel" data-dismiss="modal">Not now</button>' +
                  '<button class="btn btn-primary" id="ovirt-provider-install-dialog-install-button">Install</button>' +
              '</div>' +
          '</div>' +
      '</div>' +
    '</div>';
}
