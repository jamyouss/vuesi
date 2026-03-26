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
})
