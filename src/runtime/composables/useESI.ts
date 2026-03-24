import type { Component, VNode } from 'vue'
import { h, defineComponent } from 'vue'
import { v5 as uuidv5 } from 'uuid'
import { appendResponseHeader, getResponseHeaders } from 'h3'
import type { EsiAttributes } from '../../types'
import { getScript } from '../utils'
import { useRuntimeConfig, useRequestHeaders, useHead, useRequestEvent } from '#imports'

export const useESI = (componentName: string, wrappedComponent: Component): Component => {
  return defineComponent({
    inheritAttrs: false,
    async setup (_props, { attrs }): Promise<() => VNode> {
      const config = useRuntimeConfig()
      const id = uuidv5(componentName, uuidv5.URL)
      let esiProps: Record<string, unknown> = {}

      if (process.server) {
        const headers = useRequestHeaders(['x-vuesi-enabled'])

        if (config.public.vuesi.enabled && (!headers['x-vuesi-enabled'] || headers['x-vuesi-enabled'] !== 'false')) {
          const url = new URL(config.public.vuesi.fragmentPath, 'http://localhost')
          url.searchParams.append('component', componentName)

          if (Object.keys(attrs).length) {
            url.searchParams.append('props', JSON.stringify(attrs))
          }

          const event = useRequestEvent()
          const responseHeaders = getResponseHeaders(event!)
          const surrogateCapability = responseHeaders['surrogate-control']?.toString()

          if (!surrogateCapability || !surrogateCapability.split(',').includes('content=ESI/1.0')) {
            appendResponseHeader(event!, 'surrogate-control', 'content=ESI/1.0')
          }

          const esiIncludeAttributes: EsiAttributes = { src: url.pathname + url.search }

          if (config.public.vuesi.ignoreErrors) {
            esiIncludeAttributes.onerror = 'continue'
          }

          return () => h('esi:include', esiIncludeAttributes)
        } else {
          // ESI disabled — import and render the component directly
          // @ts-ignore - generated at build time
          const { registry } = await import('#build/vuesi-registry.mjs')
          const loader = registry[componentName]

          if (!loader) {
            throw new Error(`[vuesi] Component "${componentName}" not found in registry`)
          }

          const cp = await loader()
          esiProps = await cp.Vuesi.props()

          useHead({
            script: [
              getScript(id, esiProps)
            ]
          })
        }
      } else {
        esiProps = window.__VUESI__?.[id] ?? {}
      }

      return () => h(wrappedComponent, {
        ...attrs,
        ...esiProps
      })
    }
  })
}
