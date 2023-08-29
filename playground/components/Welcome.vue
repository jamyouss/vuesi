<template>
  Bonjour {{ props.username }}
</template>

<script lang="ts">
import type { FragmentData } from '../../src/types';

export const Vuesi: FragmentData = {
  cacheControl: 'public, max-age=120',
  props: async () => {
    const user: any = await $fetch('https://jsonplaceholder.typicode.com/users/1') as Array<any>

    return {
      username: user.name
    }
  }
}
</script>

<script setup lang="ts">
interface Props {
  username: string
}

const props = defineProps<Props>()
</script>