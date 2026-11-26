import { describe, test, expect } from 'vitest'
import { advertisesEsi, esiInclude, getScript } from '../src/runtime/utils'

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

describe('esiInclude', () => {
  test('writes a self-closing tag', () => {
    expect(esiInclude({ src: '/api/_fragment?component=A', onerror: 'continue' }))
      .toBe('<esi:include src="/api/_fragment?component=A" onerror="continue"/>')
  })

  test('escapes attribute values, & included (an ESI processor decodes &amp;)', () => {
    expect(esiInclude({ src: '/f?component=A&props={"x":"<y>"}' }))
      .toBe('<esi:include src="/f?component=A&amp;props={&quot;x&quot;:&quot;&lt;y&gt;&quot;}"/>')
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
