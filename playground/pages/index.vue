<template>
  <div>
    <WelcomeESI />
    <CommentESI />
  </div>
</template>

<script setup lang="ts">
import { useESI, resolveComponent, useRequestEvent } from '#imports'
import { appendResponseHeader } from 'h3'

const WelcomeESI = useESI(resolveComponent('Welcome'))
const CommentESI = useESI(resolveComponent('Comments'))

if (process.server) {
  const event = useRequestEvent()
  appendResponseHeader(event, 'cache-controle', 'public, max-age=3600')
}
</script>
