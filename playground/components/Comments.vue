<template>
  <h3>Comments</h3>
  <ul>
    <li v-for="comment in props.comments">
      {{ comment.name }}
    </li>
  </ul>
</template>
  
<script lang="ts">
import type { FragmentData } from '../../src/types';

export const Vuesi: FragmentData = {
  cacheControl: 'public, max-age=60',
  props: async () => ({
    comments: await $fetch('https://jsonplaceholder.typicode.com/comments')
  })
}
</script>
  
<script setup lang="ts">
interface Props {
  comments: Array<any>
}

const props = defineProps<Props>()
</script>