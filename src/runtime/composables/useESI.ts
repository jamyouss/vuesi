import type { SetupContext, Component, VNode, ComponentPropsOptions, ConcreteComponent } from 'vue'
import type { EsiAttributes } from '../../types'
import { h } from 'vue'
import { v5 as uuidv5 } from 'uuid'
import { appendResponseHeader, getResponseHeaders } from 'h3'
import { getScript } from '../utils'
import { useRuntimeConfig, useRequestHeaders, useHead, useRequestEvent } from '#imports'

export const useESI = (wrappedComponent: ConcreteComponent): Component => ({
  inheritAttrs: false,
  async setup (_props: ComponentPropsOptions, { attrs }: SetupContext): Promise<() => VNode> {
    if (!wrappedComponent.__file) {
      throw new Error('useESI: component.__file is undefined')
    }

    const config = useRuntimeConfig()

    const id = uuidv5(wrappedComponent.__file, uuidv5.URL)
    let esiProps = {}

    if (process.server) {
      const headers = useRequestHeaders(['x-vuesi-enabled'])

      if (config.public.vuesi.enabled && (!headers['x-vuesi-enabled'] || headers['x-vuesi-enabled'] !== 'false')) {
        const url = new URL(config.public.vuesi.fragmentPath, 'http://example.com')
        url.searchParams.append('component', wrappedComponent.__file)

        if (Object.keys(attrs).length) {
          url.searchParams.append('props', JSON.stringify(attrs))
        }

        const event = useRequestEvent()
        const responseHeaders = getResponseHeaders(event)
        const surrogateCapability = responseHeaders['surrogate-control']?.toString()

        if (!surrogateCapability || !surrogateCapability.split(',').includes('content=ESI/1.0')) {
          appendResponseHeader(event, 'surrogate-control', 'content=ESI/1.0')
        }

        const esiIncludeAttributes: EsiAttributes = { src: url.pathname + url.search }

        if (config.public.vuesi.ignoreErrors) {
          esiIncludeAttributes.onerror = 'continue'
        }

        return () => h('esi:include', esiIncludeAttributes)
      } else {
        const cp = await import(/* @vite-ignore */ wrappedComponent.__file as string)
        esiProps = await cp.Vuesi.props()

        useHead({
          script: [
            getScript(id, esiProps)
          ]
        })
      }
    } else {
      esiProps = window.__VUESI__[id]
    }

    return () => h(wrappedComponent, {
      ...attrs,
      ...esiProps
    })
  }
})
