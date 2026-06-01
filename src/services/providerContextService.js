module.exports.getProviderContext = async function getProviderContext(provider, faxId) {
  const base = {
    provider,
    hipaa: provider === 'sinch' || provider === 'telnyx',
    encryption: true,
    region: provider === 'sinch' ? 'us-east' : 'us-central',
  };

  if (provider === 'sinch') {
    return {
      ...base,
      logs: await getSinchLogs(faxId),
      errorMap: SINCH_ERROR_MAP,
      retryPolicy: 'sinch-default',
    };
  }

  if (provider === 'telnyx') {
    return {
      ...base,
      logs: await getTelnyxLogs(faxId),
      errorMap: TELNYX_ERROR_MAP,
      retryPolicy: 'telnyx-default',
    };
  }

  return base;
};
