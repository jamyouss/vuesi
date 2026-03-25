# Vuesi - Nuxt ESI Module

Nuxt module that enables per-component Edge Side Includes (ESI) caching. Components are rendered as `<esi:include>` tags on the server, allowing CDN/edge servers (e.g., Varnish) to cache and assemble fragments independently.

## Architecture

```
src/
  module.ts                          # Nuxt module definition, component scanning, page/plugin registration
  types.d.ts                         # ModuleOptions, EsiAttributes, FragmentData, VuesiComponentRegistry
  runtime/
    composables/useESI.ts            # useESI() composable - wraps components with ESI logic
    pages/api/_fragment.vue           # Fragment endpoint - renders individual components for ESI fetching
    server/plugins/fragment.ts        # Nitro plugin - extracts fragment HTML from full page render
    utils.ts                         # getScript() - generates client hydration scripts
playground/                          # Dev/test app with example components (Welcome, Comments)
test/
  fragment.test.ts                   # E2E tests using @nuxt/test-utils
  utils.test.ts                      # Unit tests for getScript utility
```

### How it works

1. **`useESI(name, component)`** - On server render, emits `<esi:include src="/api/_fragment?component=Name">` instead of the actual component. Sets `surrogate-control: content=ESI/1.0` header.
2. **`/api/_fragment`** - Fragment page receives the component name via query param, loads it from a build-time generated registry (`vuesi-registry.mjs`), calls `Vuesi.props()` for async data, and renders the component.
3. **Nitro plugin** - Hooks into `render:html` and `render:response` to extract just the fragment content (between `<!--VUESI_START-->` and `<!--VUESI_END-->` markers) instead of returning a full HTML page.
4. **Client hydration** - Props are serialized into `window.__VUESI__[id]` via inline scripts, allowing client-side hydration without re-fetching data.

### Component contract

Components opt into ESI by exporting a `Vuesi` object conforming to `FragmentData`:

```ts
export const Vuesi: FragmentData = {
  cacheControl: 'public, max-age=120',  // optional
  props: async () => {
    // fetch data, return props object
    return { username: 'John' }
  }
}
```

## Commands

```bash
yarn dev              # Run playground dev server
yarn dev:build        # Build playground
yarn dev:prepare      # Stub module + prepare playground
yarn test             # Run tests (vitest)
yarn lint             # ESLint
yarn lint:fix         # ESLint with auto-fix
yarn prepack          # Build module for publishing (nuxt-module-build)
```

## Module Options

Configured via `nuxt.config.ts` under the `vuesi` key:

| Option | Default | Description |
|---|---|---|
| `enabled` | `true` | Enable/disable ESI includes globally |
| `fragmentPath` | `/api/_fragment` | URL path for the fragment endpoint |
| `ignoreErrors` | `true` | Add `onerror="continue"` to ESI tags |

## Testing

- **E2E tests** (`test/fragment.test.ts`): Use `@nuxt/test-utils/e2e` with the playground app as rootDir. Tests spin up a real Nuxt server.
- **Unit tests** (`test/utils.test.ts`): Direct vitest tests for utility functions.
- Run all tests: `yarn test`

## Key Dependencies

- `@nuxt/kit` - Module utilities
- `uuid` (v5) - Deterministic component IDs from names
- `vue ^3.4` - Peer dependency

## Docker / Varnish

`docker-compose.yml.dist` provides a dev setup with Node + Varnish for testing ESI processing end-to-end.
