<template>
  <component
    :is="component.default"
    v-bind="props"
  />
</template>

<script setup lang="ts">
import { v5 as uuidv5 } from 'uuid'
import { appendResponseHeader } from 'h3'
import { getScript } from '../../utils'
import { useRoute, useHead, useRequestEvent } from '#imports'

const route = useRoute()
const componentPath = route.query.component as string

const component = await import(/* @vite-ignore */ componentPath)

const id = uuidv5(componentPath, uuidv5.URL)
const esiProps = await component.Vuesi.props()

const props = {
  ...JSON.parse(route.query.props as string ?? '{}'),
  ...esiProps
}

if (component.Vuesi.cacheControl) {
  const event = useRequestEvent()
  appendResponseHeader(event, 'cache-control', component.Vuesi.cacheControl)
}

useHead({
  script: [
    getScript(id, esiProps)
  ]
})
</script>
