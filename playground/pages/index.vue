<template>
  <div>
    <WelcomeESI />
    <CommentESI />
  </div>
</template>

<script setup lang="ts">
import { appendResponseHeader } from 'h3'
import { useESI, resolveComponent, useRequestEvent } from '#imports'

const WelcomeESI = useESI('Welcome', resolveComponent('Welcome'))
const CommentESI = useESI('Comments', resolveComponent('Comments'))

if (process.server) {
  const event = useRequestEvent()
  appendResponseHeader(event!, 'cache-control', 'public, max-age=3600')
}
</script>
