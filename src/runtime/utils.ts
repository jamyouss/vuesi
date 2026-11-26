import type { EsiAttributes } from '../types'

const HTML_ATTRIBUTE_ESCAPES: Record<string, string> = { '&': '&amp;', '"': '&quot;', '<': '&lt;', '>': '&gt;' }

// ESI 1.0 declares <esi:include/> empty: a separate end tag is an error to an ESI processor
// (Varnish: "</esi:include> illegal end-tag"). Vue renders any non-HTML-void tag with one,
// so the tag is written as raw markup instead.
export const esiInclude = (attributes: EsiAttributes): string => {
  const serialized = Object.entries(attributes)
    .map(([name, value]) => `${name}="${String(value).replace(/[&"<>]/g, char => HTML_ATTRIBUTE_ESCAPES[char]!)}"`)
    .join(' ')

  return `<esi:include ${serialized}/>`
}

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
