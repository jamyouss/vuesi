import { describe, test, expect } from 'vitest'
import { advertisesEsi, getScript } from '../src/runtime/utils'

describe('getScript', () => {
  test('generates correct hydration script', () => {
    const result = getScript('test-id', { foo: 'bar' })

    expect(result.class).toBe('__VUESI__')
    expect(result.innerHTML).toContain("window.__VUESI__['test-id']")
    expect(result.innerHTML).toContain('"foo":"bar"')
    expect(result.innerHTML).toContain('document.currentScript.remove()')
  })

  test('escapes < characters to prevent XSS', () => {
    const result = getScript('test-id', { html: '</script><script>alert(1)</script>' })

    expect(result.innerHTML).not.toContain('</script>')
    expect(result.innerHTML).toContain('\\u003c')
  })

  test('handles empty props', () => {
    const result = getScript('test-id', {})

    expect(result.innerHTML).toContain("window.__VUESI__['test-id']={}")
  })

  test('handles nested objects', () => {
    const result = getScript('test-id', { nested: { a: 1, b: 'two' } })

    expect(result.innerHTML).toContain('"nested"')
    expect(result.innerHTML).toContain('"a":1')
  })

  test('initializes window.__VUESI__ if not present', () => {
    const result = getScript('test-id', {})

    expect(result.innerHTML).toContain('window.__VUESI__ = window.__VUESI__ || {}')
  })
})

describe('advertisesEsi', () => {
  test.each([
    'varnish="ESI/1.0"',
    'varnish=ESI/1.0',
    'abc="ESI/1.0 ESI-Inline/1.0"',
    'abc="ESI-Inline/1.0 ESI/1.0"',
    'cdn="Foo/1.0", varnish="ESI/1.0"',
    'cdn="Foo/1.0",varnish="esi/1.0"'
  ])('accepts %s', (value) => {
    expect(advertisesEsi(value)).toBe(true)
  })

  test.each([
    undefined,
    '',
    'varnish="Foo/1.0"',
    'varnish="ESI/2.0"',
    'varnish="ESI/1.0x"',
    'varnish="ESI-Inline/1.0"',
    'ESI/1.0',
    'garbage'
  ])('rejects %s', (value) => {
    expect(advertisesEsi(value)).toBe(false)
  })
})
