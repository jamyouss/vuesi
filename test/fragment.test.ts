import { describe, test, expect, beforeEach } from 'vitest'
import { setup, $fetch, useTestContext } from '@nuxt/test-utils/e2e'
import { consola } from 'consola'
import path from 'path'

describe('fragment', async () => {
  await setup({
    rootDir: path.resolve(__dirname, '../playground'),
    server: true
  })

  beforeEach(() => {
    consola.restoreConsole() 
  })

  test('page contain the esi:include tag', async () => {
    const html = await $fetch('/')

    expect(html).toMatch(/<esi:include src="\/api\/_fragment\?component=.*%2Fcomponents%2FWelcome.vue" onerror="continue"><\/esi:include>/)
  })

  test('render the esi:include tag', async () => {
    const context = useTestContext()
   
    const url = `/api/_fragment?component=${context.options.rootDir}/components/Welcome.vue`
    const html = await $fetch(url)

    expect(html).toContain('Bonjour Leanne Graham')
  })
})
