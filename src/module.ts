import { fileURLToPath } from 'url'
import { readdirSync, statSync } from 'fs'
import { join, basename, resolve as pathResolve } from 'path'
import { defineNuxtModule, createResolver, addServerPlugin, extendPages, addImportsDir, addTemplate } from '@nuxt/kit'
import type { NuxtPage } from '@nuxt/schema'
import type { ModuleOptions, VuesiComponentRegistry } from './types'

function scanComponents (dir: string): VuesiComponentRegistry {
  const registry: VuesiComponentRegistry = {}

  try {
    const entries = readdirSync(dir, { recursive: true }) as string[]
    for (const entry of entries) {
      const fullPath = join(dir, entry)
      if (!entry.endsWith('.vue') || !statSync(fullPath).isFile()) {
        continue
      }
      const name = basename(entry, '.vue')
      const pascalName = name.replace(/(^|[-_])(\w)/g, (_, __, c: string) => c.toUpperCase())
      registry[pascalName] = fullPath
    }
  } catch {
    // components directory may not exist
  }

  return registry
}

export default defineNuxtModule<ModuleOptions>({
  meta: {
    name: 'vuesi',
    configKey: 'vuesi'
  },
  defaults: {
    enabled: true,
    fragmentPath: '/api/_fragment',
    ignoreErrors: true,
    scanComponents: true
  },
  async setup (options, nuxt) {
    const { resolve } = createResolver(import.meta.url)
    const runtimeDir = fileURLToPath(new URL('./runtime', import.meta.url))

    nuxt.options.runtimeConfig.public.vuesi = {
      enabled: options.enabled,
      fragmentPath: options.fragmentPath,
      ignoreErrors: options.ignoreErrors
    }

    // Source 1: Scan app components directory (can be disabled)
    const registry: VuesiComponentRegistry = {}
    if (options.scanComponents !== false) {
      const componentsDir = pathResolve(nuxt.options.srcDir, 'components')
      Object.assign(registry, scanComponents(componentsDir))
    }

    // Source 2: Explicit components from module options
    if (options.components) {
      Object.assign(registry, options.components)
    }

    // Source 3: Hook for libraries to register their own ESI components
    await nuxt.callHook('vuesi:components' as any, registry)

    // Generate a virtual module that maps component names to lazy imports
    // This allows Vite to bundle the components and resolve .vue files at build time
    const registryEntries = Object.entries(registry)
    const imports = registryEntries.map(([name, path]) =>
      `  '${name}': () => import('${path}')`
    ).join(',\n')

    addTemplate({
      filename: 'vuesi-registry.mjs',
      getContents: () => `export const registry = {\n${imports}\n}\n`
    })

    // Also store names in runtimeConfig for validation (no paths exposed)
    nuxt.options.runtimeConfig.vuesiComponentNames = Object.keys(registry)

    extendPages((pages: NuxtPage[]) => {
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
