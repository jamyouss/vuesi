export interface ModuleOptions {
  enabled: boolean
  fragmentPath: string
  ignoreErrors: boolean
}

export interface EsiAttributes {
  src: string
  onerror?: 'continue'
}

export interface FragmentData {
  cacheControl: string
  props: () => Promise<{ [key: string]: any }>
}

declare module 'nuxt/schema' {
  interface PublicRuntimeConfig {
    vuesi: ModuleOptions
  }
}
