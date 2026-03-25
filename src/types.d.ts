export interface ModuleOptions {
  enabled: boolean
  fragmentPath: string
  ignoreErrors: boolean
  scanComponents?: boolean
  components?: Record<string, string>
}

export interface EsiAttributes {
  src: string
  onerror?: 'continue'
}

export interface FragmentData {
  cacheControl?: string
  props: () => Promise<Record<string, unknown>>
}

export interface VuesiComponentRegistry {
  [name: string]: string
}

declare module 'nuxt/schema' {
  interface PublicRuntimeConfig {
    vuesi: Pick<ModuleOptions, 'enabled' | 'fragmentPath' | 'ignoreErrors'>
  }
  interface RuntimeConfig {
    vuesiComponentNames: string[]
  }
}
