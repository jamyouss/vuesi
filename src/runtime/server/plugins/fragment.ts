import type { NitroApp, RenderResponse } from 'nitropack'
import type { H3Event, EventHandlerRequest } from 'h3'
// eslint-disable-next-line import/named
import { defineNitroPlugin, useRuntimeConfig } from '#imports'

interface VuesiH3Event extends H3Event {
  __vuesiBody?: string
}

export default defineNitroPlugin((nitroApp: NitroApp) => {
  const config = useRuntimeConfig()

  nitroApp.hooks.hook('render:html', (html: any, { event }: { event: H3Event<EventHandlerRequest> }) => {
    if (!event.node.req.url?.startsWith(config.public.vuesi.fragmentPath)) {
      return
    }

    const body = html.body[0] as string
    const startMarker = '<!--VUESI_START-->'
    const endMarker = '<!--VUESI_END-->'

    const startIdx = body.indexOf(startMarker)
    const endIdx = body.indexOf(endMarker)

    if (startIdx === -1 || endIdx === -1) {
      // eslint-disable-next-line no-console
      console.warn('[vuesi] Failed to extract fragment content from rendered HTML')
      return
    }

    const fragmentContent = body.slice(startIdx + startMarker.length, endIdx).trim()

    // Extract the vuesi hydration script from head
    const head = html.head[0] as string
    const scriptStart = head.indexOf('<script class="__VUESI__">')
    const scriptEnd = head.indexOf('</script>', scriptStart)

    let scriptContent = ''
    if (scriptStart !== -1 && scriptEnd !== -1) {
      scriptContent = head.slice(scriptStart + '<script class="__VUESI__">'.length, scriptEnd)
    }

    const vuesiEvent = event as VuesiH3Event
    vuesiEvent.__vuesiBody = scriptContent
      ? `${fragmentContent}<script type="text/javascript">${scriptContent}</script>`
      : fragmentContent
  })

  nitroApp.hooks.hook('render:response', (response: Partial<RenderResponse>, { event }: { event: H3Event<EventHandlerRequest> }) => {
    if (!event.node.req.url?.startsWith(config.public.vuesi.fragmentPath)) {
      return
    }

    const vuesiEvent = event as VuesiH3Event
    if (vuesiEvent.__vuesiBody) {
      response.body = vuesiEvent.__vuesiBody
    }
  })
})
