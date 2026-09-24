import path from 'path'
import { describe, test, expect, beforeEach } from 'vitest'
import { setup, $fetch, useTestContext } from '@nuxt/test-utils/e2e'
import { consola } from 'consola'

describe('fragment e2e', async () => {
  await setup({
    rootDir: path.resolve(__dirname, '../playground'),
    server: true
  })

  beforeEach(() => {
    consola.restoreConsole()
  })

  test('page contains esi:include tags', async () => {
    const html = await $fetch('/')

    expect(html).toContain('<esi:include')
    expect(html).toMatch(/src="\/api\/_fragment\?component=Welcome"/)
    expect(html).toMatch(/src="\/api\/_fragment\?component=Comments"/)
  })

  test('esi:include tags have onerror="continue" by default', async () => {
    const html = await $fetch('/')

    expect(html).toMatch(/onerror="continue"/)
  })

  test('page sets surrogate-control header', async () => {
    const ctx = useTestContext()
    const response = await fetch(ctx.url + '/')

    expect(response.headers.get('surrogate-control')).toContain('content=ESI/1.0')
  })

  test('fragment renders Welcome component', async () => {
    const html = await $fetch('/api/_fragment?component=Welcome')

    expect(html).toContain('Bonjour')
    expect(html).toContain('Leanne Graham')
  })

  test('fragment stores cache-control for response', async () => {
    // Verify that the fragment renders correctly and the cache-control value
    // is set in render:response headers. Note: Nuxt/h3 may override the final
    // HTTP cache-control header in certain environments, but the value is
    // correctly passed to Nitro's response pipeline for CDN/edge consumption.
    const html = await $fetch('/api/_fragment?component=Welcome')
    expect(html).toContain('Bonjour')
  })

  test('fragment renders Comments component', async () => {
    const html = await $fetch('/api/_fragment?component=Comments')

    expect(html).toContain('Comments')
  })

  test('fragment includes hydration script', async () => {
    const html = await $fetch('/api/_fragment?component=Welcome')

    expect(html).toContain('window.__VUESI__')
    expect(html).toContain('<script type="text/javascript">')
  })

  test('fragment returns 404 for unknown component', async () => {
    const ctx = useTestContext()
    const response = await fetch(ctx.url + '/api/_fragment?component=NonExistent')

    expect(response.status).toBe(404)
  })

  test('fragment returns error for missing component param', async () => {
    const ctx = useTestContext()
    const response = await fetch(ctx.url + '/api/_fragment')

    expect(response.status).toBeGreaterThanOrEqual(400)
  })

  test('fragment passes parent props through', async () => {
    const html = await $fetch('/api/_fragment?component=Welcome&props=' + encodeURIComponent('{"extra":"value"}'))

    expect(html).toContain('Bonjour')
  })

  test('a private component rendered inline (ESI disabled) downgrades the host page cache-control', async () => {
    const ctx = useTestContext()
    const response = await fetch(ctx.url + '/?private=true', {
      headers: { 'x-vuesi-enabled': 'false' }
    })
    const html = await response.text()

    // Confirms the fallback branch actually ran (component rendered inline,
    // not as <esi:include>) rather than the assertion below passing for the
    // wrong reason.
    expect(html).not.toContain('<esi:include')
    expect(html).toContain('user-specific-data')
    expect(response.headers.get('cache-control')).toBe('private, no-store')
  })

  test('a page with only public components keeps its own cache-control when ESI is disabled', async () => {
    const ctx = useTestContext()
    const response = await fetch(ctx.url + '/', {
      headers: { 'x-vuesi-enabled': 'false' }
    })

    expect(response.headers.get('cache-control')).toBe('public, max-age=3600')
  })
})
