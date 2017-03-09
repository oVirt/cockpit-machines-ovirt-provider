/*
 * This file is part of Cockpit.
 *
 * Copyright (C) 2017 Red Hat, Inc.
 *
 * Cockpit is free software; you can redistribute it and/or modify it
 * under the terms of the GNU Lesser General Public License as published by
 * the Free Software Foundation; either version 2.1 of the License, or
 * (at your option) any later version.
 *
 * Cockpit is distributed in the hope that it will be useful, but
 * WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the GNU
 * Lesser General Public License for more details.
 *
 * You should have received a copy of the GNU Lesser General Public License
 * along with Cockpit; If not, see <http://www.gnu.org/licenses/>.
 */

/**
 * The simplest external provider for cockpit:machines.
 *
 * Used
 *   - for integration tests
 *   - as a Hello World example for 3rd party development
 *
 * Written in VanillaJS.
 *
 * For more complex UI scenarios OR React, please consider ES6/Webpack as used in the `cockpit-machines-ovirt-provider`
 * referential implementation (see cockpit:machines README.md for most current link to the project).
 *
 * Installation prerequisites:
 *   - Have cockpit-machines package version >=133 installed and running
 *
 * Installation steps:
 *   - # mkdir /usr/share/cockpit/machines/provider
 *   - # cp [PATH_TO_THIS_INDEX.JS_FILE] /usr/share/cockpit/machines/provider/
 *   - refresh/login to cockpit, go to the 'Virtual Machines' package
 */

var PROVIDER = {};
PROVIDER = {
  name: 'TEST_PROVIDER',

  actions: {}, // it's expected to be replaced by init()
  parentReactComponents: {}, // to reuse look&feel, see init()
  nextProvider: null, // will be default Libvirt provider in the basic scenario
  vmStateMap: null, // see init()

  /**
   * Lazily initialize the Provider from the `providerContext`.
   * Do login to external system if needed.
   *
   * Return boolean or Promise.
   *
   * See cockpit:machines provider.es6
   */
  init: function (providerContext) {
    /* For reference:
    providerContext = {
      defaultProvider,
      React,
      reduxStore,
      exportedActionCreators,
      exportedReactComponents,
    }
    */
    console.log("PROVIDER.init() called");

    // The external provider is loaded into context of cockpit:machines plugin
    // So, JQuery and Cockpit are available
    if (!window.$) {
      console.error('JQuery not found! The PROVIDER is not initialized, using default.');
      return false;
    }
    if (!window.cockpit) {
      console.error('Cockpit not found! The PROVIDER is not initialized, using default.');
      return false;
    }

    PROVIDER.actions = providerContext.exportedActionCreators;
    PROVIDER.parentReactComponents = providerContext.exportedReactComponents;
    PROVIDER.nextProvider = providerContext.defaultProvider;
    PROVIDER.vmStateMap = {}; // reuse map for Libvirt (defaultProvider.vmStateMap)

    return true; // or Promise
  },

  /**
   * Manage visibility of VM action buttons or so.
   *
   * Recent implementation: redirect state functions back to Libvirt provider.
   */
  canReset: function (state) {return PROVIDER.nextProvider.canReset(state);},
  canShutdown: function (state) {return PROVIDER.nextProvider.canShutdown(state)},
  isRunning: function (state) {return PROVIDER.nextProvider.isRunning(state)},
  canRun: function (state) {return PROVIDER.nextProvider.canRun(state)},
  canConsole: function (state) {return PROVIDER.nextProvider.canConsole(state)},

  /**
   * Get a single VM
   *
   * Not needed for the scope of this minimal PROVIDER.
   *
   * See cockpit:machines actions.es6.
   */
  GET_VM: function (payload) {
    console.log('PROVIDER.GET_VM called with params: ' + JSON.stringify(payload));
    return function (dispatch) {console.log('GET_VM not implemented for this PROVIDER');};
  },

  /**
   * Initiate read of all VMs.
   */
  GET_ALL_VMS: function (payload) {
    console.log('PROVIDER.GET_ALL_VMS() called');
      /* To redirect the call to Libvirt:
       *    return PROVIDER.nextProvider.GET_ALL_VMS(payload);
       */

    return function (dispatch) {
      // Do external call to get data, return Promise.
      // Update Redux store via dispatching actions.
      var dfd = window.cockpit.defer();

      var CONNECTION_NAME = 'testConnection';
      dispatch(PROVIDER.actions.updateOrAddVm({
        connectionName: CONNECTION_NAME,
        name: 'vm1',
        id: 'id-vm1',
        osType: '',
        currentMemory: '1048576', // 1 GB
        vcpus: 1
      }));
      dispatch(PROVIDER.actions.updateOrAddVm({
        connectionName: CONNECTION_NAME,
        name: 'vm1',
        state: 'running',
        autostart: 'enable'
      }));

      dispatch(PROVIDER.actions.updateOrAddVm({
        connectionName: CONNECTION_NAME,
        name: 'vm2',
        id: 'id-vm2',
        osType: '',
        currentMemory: '2097152', // 2 GB
        vcpus: 2,
        state: 'shut off',
        autostart: 'disable'
      }));

      dfd.resolve();
      return dfd.promise;
    };
  },

};

window.EXTERNAL_PROVIDER = PROVIDER;
