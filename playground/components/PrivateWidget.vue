<template>
  Private: {{ props.secret }}
</template>

<script lang="ts">
import type { FragmentData } from '../../src/types';

export const Vuesi: FragmentData = {
  cacheControl: 'private, no-store',
  props: async () => ({
    secret: 'user-specific-data'
  })
}
</script>

<script setup lang="ts">
interface Props {
  secret: string
}

const props = defineProps<Props>()
</script>
