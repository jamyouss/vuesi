export const getScript = (id: string, props: Record<string, unknown>) => {
  const serialized = JSON.stringify(props).replace(/</g, '\\u003c')

  return {
    class: '__VUESI__',
    innerHTML: `window.__VUESI__ = window.__VUESI__ || {};window.__VUESI__['${id}']=${serialized};document.currentScript.remove()`
  }
}

// Surrogate-Capability (W3C Edge Architecture): `device="CAP CAP", device2="CAP"`. Quotes are
// optional because common configs (e.g. Varnish `varnish=ESI/1.0`) omit them.
export const advertisesEsi = (surrogateCapability: string | undefined): boolean => {
  if (!surrogateCapability) {
    return false
  }

  return surrogateCapability.split(',').some((entry) => {
    const separator = entry.indexOf('=')

    if (separator === -1) {
      return false
    }

    return entry.slice(separator + 1).trim().replace(/^"|"$/g, '')
      .split(/\s+/)
      .some(capability => capability.toUpperCase() === 'ESI/1.0')
  })
}
