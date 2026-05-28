const sinchProvider = require('./sinchProvider')
const telnyxProvider = require('./telnyxProvider')

function getDefaultProviderName() {
  return process.env.DEFAULT_FAX_PROVIDER || 'sinch'
}

function getProviderByName(name) {
  const key = (name || '').toLowerCase()

  if (key === 'telnyx') return telnyxProvider
  if (key === 'sinch') return sinchProvider

  return sinchProvider
}

function getProviderForTenant(tenant) {
  // later you can store tenant.provider = 'sinch' | 'telnyx'
  if (tenant?.faxProvider) {
    return getProviderByName(tenant.faxProvider)
  }
  return getProviderByName(getDefaultProviderName())
}

module.exports = {
  getProviderByName,
  getProviderForTenant,
  getDefaultProviderName
}
