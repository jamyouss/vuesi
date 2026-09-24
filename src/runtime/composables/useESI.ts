import type { Component, VNode } from 'vue'
// withAsyncContext: exported by Vue's runtime, not part of its public .d.ts
// (hence the ignores) - see its usage below for why this file needs it.
// @ts-ignore -- exported at runtime, not in Vue's public type declarations
// eslint-disable-next-line import/named -- same as above
import { h, defineComponent, withAsyncContext } from 'vue'
import { v5 as uuidv5 } from 'uuid'
import { appendResponseHeader, getResponseHeaders, setResponseHeader } from 'h3'
import type { EsiAttributes } from '../../types'
import { getScript } from '../utils'
import { useRuntimeConfig, useRequestHeaders, useHead, useRequestEvent } from '#imports'

// cacheControl values meaning "don't cache/reuse this response" - see the
// ESI-disabled branch below.
const UNCACHEABLE_DIRECTIVE = /\b(private|no-store|no-cache)\b/

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
          // ESI disabled — import and render the component directly.
          //
          // This is a plain defineComponent({ async setup() }), not an SFC
          // <script setup>, so it doesn't get the compiler's automatic
          // withAsyncContext wrapping around awaits. Without it, Vue clears
          // currentInstance after the first await - a composable called from
          // a component's own Vuesi.props() (e.g. a Pinia store) would then
          // fail to resolve via injection and fall back to the module-global
          // active instance, which under concurrent SSR requests can belong
          // to a DIFFERENT request. withAsyncContext + restore() right after
          // each await replicates exactly what <script setup> itself
          // compiles to for top-level awaits.
          let asyncContext: unknown
          let restoreAsyncContext: () => void

          // @ts-ignore - generated at build time
          ;[asyncContext, restoreAsyncContext] = withAsyncContext(() => import('#build/vuesi-registry.mjs'))
          const { registry } = await asyncContext as typeof import('#build/vuesi-registry.mjs')
          restoreAsyncContext()

          const loader = registry[componentName]

          if (!loader) {
            throw new Error(`[vuesi] Component "${componentName}" not found in registry`)
          }

          ;[asyncContext, restoreAsyncContext] = withAsyncContext(() => loader())
          const cp = await asyncContext as Awaited<ReturnType<typeof loader>>
          restoreAsyncContext()

          ;[asyncContext, restoreAsyncContext] = withAsyncContext(() => cp.Vuesi.props())
          esiProps = await asyncContext as Record<string, unknown>
          restoreAsyncContext()

          // A component rendered inline here (rather than as its own ESI
          // fragment) that declares itself private/uncacheable would otherwise
          // have that constraint silently dropped, leaving the HOST page free
          // to be cached with this component's (and its data's) output baked
          // into it. Force the host response at least as restrictive - a
          // permissive/absent cacheControl is left alone since it can't make
          // this response any less safe to cache than it already was.
          if (cp.Vuesi.cacheControl && UNCACHEABLE_DIRECTIVE.test(cp.Vuesi.cacheControl)) {
            const event = useRequestEvent()

            if (event) {
              setResponseHeader(event, 'cache-control', cp.Vuesi.cacheControl)
            }
          }

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
