import PROVIDER from './provider.js';

(function initOvirtProvider () {
  console.log('Registering the oVirt provider');

  window.EXTERNAL_PROVIDER = PROVIDER;
}());
