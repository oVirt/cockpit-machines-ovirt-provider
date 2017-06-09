import { logDebug } from './helpers.js'
import CONFIG from './config.js'
import { toggleLoginInProgress } from './components/topLevelViewSwitch.jsx'

export function doLogin (checkApiVersionFunc) {
  logDebug('_login() called')

  const baseUrl = CONFIG.OVIRT_BASE_URL
  const location = window.top.location;
  const tokenStart = location.hash.indexOf('token=')
  let token = window.sessionStorage.getItem('OVIRT_PROVIDER_TOKEN') // as default

  logDebug(`location: '${location.toString()}'\ntokenStart='${tokenStart}'\ntoken='${token}'`)

  if (tokenStart >= 0) { // TOKEN received as a part of URL has precedence
    token = location.hash.substr(tokenStart + 'token='.length)
    logDebug(`doLogin(): token found in params: ${token}`)
    CONFIG.token = token
    toggleLoginInProgress()
    window.sessionStorage.setItem('OVIRT_PROVIDER_TOKEN', token)
    logDebug(`doLogin(): token from params stored to sessionStorage, now removing the token hash from the url`)
    window.top.location.hash = ''

    return checkApiVersionFunc()
  } else if (token) { // found in the sessionStorrage
    logDebug(`doLogin(): token found in sessionStorrage: ${token}`)
    CONFIG.token = token
    toggleLoginInProgress()
    return checkApiVersionFunc()
  } else { // redirect to oVirt's SSO
    const hostUrl = `https://${window.location.host}`
    const ssoUrl = `${baseUrl}/web-ui/authorizedRedirect.jsp?redirectUrl=${hostUrl}/machines/__hash__token=TOKEN`
    logDebug(`doLogin(): missing oVirt SSO token, redirecting to SSO: ${ssoUrl}`);

    window.top.location = ssoUrl;
  }
  return false
}
