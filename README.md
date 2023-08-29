# VueESI

[![npm version][npm-version-src]][npm-version-href]
[![npm downloads][npm-downloads-src]][npm-downloads-href]
[![License][license-src]][license-href]
[![Nuxt][nuxt-src]][nuxt-href]

Nuxt Vue ESI module for a Blazing-fast Server-Side Rendering.

- [✨ &nbsp;Release Notes](/CHANGELOG.md)


## Quick Setup

1. Add `vuesi` dependency to your project

```bash
# Using yarn
yarn add --dev vuesi

# Using npm
npm install --save-dev vuesi
```

2. Add `vuesi` to the `modules` section of `nuxt.config.ts` and configure if needed

```js
export default defineNuxtConfig({
  modules: [
    'vuesi'
  ],
  vuesi: {
    // Options
  }
})
```

### Options

| Option         | Type      | Default          | Description                               |
|----------------|-----------|------------------|-------------------------------------------|
| `enabled`      | `Boolean` | `true`           | Enable or disable the module              |
| `fragmentPath` | `String`  | `/api/_fragment` | ESI Fragement API Path                    |
| `ignoreErrors` | `Boolean` | `true`           | Ignore errors when fetching ESI fragments |

### That's it! You can now use VueESI in your Nuxt app ✨

## Examples

```
<template>
  <WelcomeESI username="John DOE" />
</template>

<script setup lang="ts">
import { useESI, resolveComponent } from '#imports'

const WelcomeESI = useESI(resolveComponent('Welcome'))
</script>
```

## Development

For development/testing purposes, docker-compose config is provided with basic varnish config.

1. Clone this repository
2. Install dependencies using `yarn install` or `npm install`
3. Start development server using `docker-compose up`

### Commands

```bash
# Install dependencies
npm install

# Generate type stubs
npm run dev:prepare

# Develop with the playground
npm run dev

# Build the playground
npm run dev:build

# Run ESLint
npm run lint

# Run Vitest
npm run test
npm run test:watch
```

<!-- Badges -->
[npm-version-src]: https://img.shields.io/npm/v/vuesi/latest.svg?style=flat&colorA=18181B&colorB=28CF8D
[npm-version-href]: https://npmjs.com/package/vuesi

[npm-downloads-src]: https://img.shields.io/npm/dm/vuesi.svg?style=flat&colorA=18181B&colorB=28CF8D
[npm-downloads-href]: https://npmjs.com/package/vuesi

[license-src]: https://img.shields.io/npm/l/vuesi.svg?style=flat&colorA=18181B&colorB=28CF8D
[license-href]: https://npmjs.com/package/vuesi

[nuxt-src]: https://img.shields.io/badge/Nuxt-18181B?logo=nuxt.js
[nuxt-href]: https://nuxt.com
