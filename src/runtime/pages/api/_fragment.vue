<template>
  <!--VUESI_START-->
  <component
    :is="resolvedComponent"
    v-bind="mergedProps"
  />
  <!--VUESI_END-->
</template>

<script setup lang="ts">
import { v5 as uuidv5 } from 'uuid'
import { appendResponseHeader, createError } from 'h3'
import { getScript } from '../../utils'
import { useRoute, useHead, useRequestEvent } from '#imports'
// @ts-ignore - generated at build time
import { registry } from '#build/vuesi-registry.mjs'

const route = useRoute()

const componentName = route.query.component as string | undefined
if (!componentName) {
  throw createError({ statusCode: 400, statusMessage: 'Missing component parameter' })
}

const loader = registry[componentName]
if (!loader) {
  throw createError({ statusCode: 404, statusMessage: `Component "${componentName}" not found in registry` })
}

const component = await loader()

if (!component.Vuesi) {
  throw createError({ statusCode: 400, statusMessage: `Component "${componentName}" does not export Vuesi fragment data` })
}

const id = uuidv5(componentName, uuidv5.URL)
const esiProps = await component.Vuesi.props()

const parentProps: Record<string, unknown> = route.query.props
  ? JSON.parse(route.query.props as string)
  : {}

const mergedProps = { ...parentProps, ...esiProps }

const resolvedComponent = component.default

if (component.Vuesi.cacheControl) {
  const event = useRequestEvent()
  appendResponseHeader(event!, 'cache-control', component.Vuesi.cacheControl)
}

useHead({
  script: [
    getScript(id, esiProps)
  ]
})
</script>
