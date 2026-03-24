# VueESI

[![npm version][npm-version-src]][npm-version-href]
[![npm downloads][npm-downloads-src]][npm-downloads-href]
[![License][license-src]][license-href]
[![Nuxt][nuxt-src]][nuxt-href]

Nuxt module for Edge Side Includes (ESI) — cache individual Vue components independently at the CDN/reverse proxy layer (e.g., Varnish).

## How It Works

1. Components wrapped with `useESI` render an `<esi:include>` tag instead of their content during SSR.
2. The response includes a `Surrogate-Control: content=ESI/1.0` header, signaling the reverse proxy to process ESI tags.
3. The proxy (e.g., Varnish) fetches each fragment independently via the fragment endpoint (`/api/_fragment`).
4. Each fragment can define its own `cache-control` header, enabling per-component cache TTLs.
5. On the client side, hydration data is injected via inline scripts so Vue picks up the server-rendered state.

## Quick Setup

1. Add `vuesi` dependency to your project

```bash
yarn add vuesi
# or
npm install vuesi
```

2. Add `vuesi` to the `modules` section of `nuxt.config.ts`

```ts
export default defineNuxtConfig({
  modules: ['vuesi'],
  vuesi: {
    // Options (all optional)
    enabled: true,
    fragmentPath: '/api/_fragment',
    ignoreErrors: true
  }
})
```

### Options

| Option         | Type      | Default          | Description                                                    |
|----------------|-----------|------------------|----------------------------------------------------------------|
| `enabled`      | `boolean` | `true`           | Enable or disable ESI tag generation                           |
| `fragmentPath` | `string`  | `/api/_fragment` | URL path for the ESI fragment endpoint                         |
| `ignoreErrors` | `boolean` | `true`           | Add `onerror="continue"` to `<esi:include>` tags               |

## Usage

### 1. Define a component with ESI fragment data

Each component that should be independently cached must export a `Vuesi` object with a `props` function (and optionally a `cacheControl` string):

```vue
<template>
  Bonjour {{ props.username }}
</template>

<script lang="ts">
import type { FragmentData } from 'vuesi'

export const Vuesi: FragmentData = {
  cacheControl: 'public, max-age=120',
  props: async () => {
    const user = await $fetch('https://api.example.com/users/1')
    return { username: user.name }
  }
}
</script>

<script setup lang="ts">
const props = defineProps<{ username: string }>()
</script>
```

### 2. Use `useESI` in your page

```vue
<template>
  <WelcomeESI />
</template>

<script setup lang="ts">
import { useESI, resolveComponent } from '#imports'

const WelcomeESI = useESI('Welcome', resolveComponent('Welcome'))
</script>
```

The first argument is the **component name** (as registered by Nuxt's auto-import). The second argument is the resolved component instance.

### 3. Set up a reverse proxy with ESI support

For development, a Docker Compose setup with Varnish is provided:

```bash
cp docker-compose.yml.dist docker-compose.yml
docker-compose up
```

The Varnish config in `config/varnish/default.vcl` enables ESI processing when the `Surrogate-Control` header is present.

## Security Notes

- **Props in URLs:** Props passed to ESI-wrapped components are serialized into the fragment URL query string. These URLs are visible in proxy logs and cache keys. **Do not pass sensitive data as props to ESI components.** Use the `Vuesi.props()` function to fetch sensitive data server-side instead.
- **Component registry:** Only components registered by Nuxt's auto-import system can be loaded via the fragment endpoint. Arbitrary file paths are not accepted.

## API Reference

### `useESI(name: string, component: Component): Component`

Wraps a component for ESI rendering.

- `name` — The PascalCase component name as registered by Nuxt (e.g., `'Welcome'`, `'Comments'`)
- `component` — The resolved component instance (via `resolveComponent()`)

Returns a new component that renders `<esi:include>` on the server (when ESI is enabled) or the original component with hydrated props on the client.

### `FragmentData` interface

Exported from each ESI-enabled component as `Vuesi`:

```ts
interface FragmentData {
  cacheControl?: string
  props: () => Promise<Record<string, unknown>>
}
```

- `cacheControl` — Optional HTTP `Cache-Control` header value for this fragment
- `props` — Async function that returns the props to pass to the component

## Development

```bash
# Install dependencies
yarn install

# Generate type stubs
yarn dev:prepare

# Develop with the playground
yarn dev

# Build the playground
yarn dev:build

# Run ESLint
yarn lint

# Run tests
yarn test
```

### Docker (Varnish)

```bash
cp docker-compose.yml.dist docker-compose.yml
docker-compose up
```

Access the app through Varnish at `http://localhost:8080`.

<!-- Badges -->
[npm-version-src]: https://img.shields.io/npm/v/vuesi/latest.svg?style=flat&colorA=18181B&colorB=28CF8D
[npm-version-href]: https://npmjs.com/package/vuesi

[npm-downloads-src]: https://img.shields.io/npm/dm/vuesi.svg?style=flat&colorA=18181B&colorB=28CF8D
[npm-downloads-href]: https://npmjs.com/package/vuesi

[license-src]: https://img.shields.io/npm/l/vuesi.svg?style=flat&colorA=18181B&colorB=28CF8D
[license-href]: https://npmjs.com/package/vuesi

[nuxt-src]: https://img.shields.io/badge/Nuxt-18181B?logo=nuxt.js
[nuxt-href]: https://nuxt.com
