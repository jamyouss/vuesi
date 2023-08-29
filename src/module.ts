import { fileURLToPath } from 'url'
import { defineNuxtModule, createResolver, addServerPlugin, extendPages, addImportsDir } from '@nuxt/kit'
import { NuxtPage } from '@nuxt/schema'
import type { ModuleOptions } from './types'

export default defineNuxtModule<ModuleOptions>({
  meta: {
    name: 'vuesi',
    configKey: 'vuesi'
  },
  defaults: {
    enabled: true,
    fragmentPath: '/api/_fragment',
    ignoreErrors: true
  },
  setup (options, nuxt) {
    const { resolve } = createResolver(import.meta.url)
    const runtimeDir = fileURLToPath(new URL('./runtime', import.meta.url))

    nuxt.options.runtimeConfig.public.vuesi = {
      ...options
    }

    extendPages((pages: Array<NuxtPage>) => {
      pages.push({
        name: 'vuesi-fragment-api',
        path: options.fragmentPath,
        file: resolve(runtimeDir, 'pages/api/_fragment.vue')
      })
    })

    addServerPlugin(resolve(runtimeDir, 'server/plugins/fragment'))

    addImportsDir(resolve(runtimeDir, 'composables'))
  }
})
