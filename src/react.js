/**
 * External provider can't create it's own React DOM,
 * it connects to the main one provided by cockpit:machines instead.
 *
 * All react component creation must be performed lazily.
 */
import { logError } from './helpers.js';

let React = null;

export function registerReact (_React) {
  if (!_React) {
    logError(`registerReact(): no react provided!`);
    return ;
  }
  React = React || _React;
}

export function getReact() {
  return React;
}

