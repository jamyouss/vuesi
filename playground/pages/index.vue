<template>
  <div>
    <WelcomeESI />
    <CommentESI />
    <PrivateWidgetESI v-if="showPrivateWidget" />
  </div>
</template>

<script setup lang="ts">
import { appendResponseHeader } from 'h3'
import { useESI, resolveComponent, useRequestEvent, useRoute } from '#imports'

const WelcomeESI = useESI('Welcome', resolveComponent('Welcome'))
const CommentESI = useESI('Comments', resolveComponent('Comments'))
const PrivateWidgetESI = useESI('PrivateWidget', resolveComponent('PrivateWidget'))

// Opt-in via query param so the existing surrogate-control/esi:include tests
// (which assert on exactly 2 components) don't need to change.
const showPrivateWidget = useRoute().query.private === 'true'

if (process.server) {
  const event = useRequestEvent()
  appendResponseHeader(event!, 'cache-control', 'public, max-age=3600')
}
</script>
