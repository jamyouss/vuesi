import type { NitroApp, RenderResponse } from 'nitropack'
import type { H3Event, EventHandlerRequest } from 'h3'
// import type { NuxtRenderHTMLContext } from 'nuxt/dist/core/runtime/nitro/renderer'
import { defineNitroPlugin, useRuntimeConfig } from '#imports'

interface VuesiH3Event extends H3Event {
  vuesi: {
    body: string
  }
}

export default defineNitroPlugin((nitroApp: NitroApp) => {
  const config = useRuntimeConfig()

  nitroApp.hooks.hook('render:html', (html: any, { event }: { event: H3Event<EventHandlerRequest> }) => {
    if (event.node.req.url?.startsWith(config.public.vuesi.fragmentPath)) {
      const htmlMatches = html.body[0].match(/<div id="__nuxt">(?<content>.*?)<\/div>/) as RegExpMatchArray
      const scriptMatches = html.head[0].match(/<script class="__VUESI__">(?<content>.*?)<\/script>/) as RegExpMatchArray

      (event as VuesiH3Event).vuesi = {
        body: `${htmlMatches?.groups?.content}<script type="text/javascript">${scriptMatches?.groups?.content}</script>`
      }
    }
  })

  nitroApp.hooks.hook('render:response', (response: Partial<RenderResponse>, { event }: { event: H3Event<EventHandlerRequest> }) => {
    if (event.node.req.url?.startsWith(config.public.vuesi.fragmentPath)) {
      response.body = (event as VuesiH3Event).vuesi.body as string
    }
  })
})
