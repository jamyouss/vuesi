import { jest, describe, expect, test } from '@jest/globals'

// Import the code you want to test
import plugin from '../../../src/runtime/server/plugins/fragment'

// Mock the necessary dependencies
jest.mock('#imports', () => {
  return {
    defineNitroPlugin: jest.fn(),
    useRuntimeConfig: jest.fn(() => ({
        public: {
          vuesi: {
            fragmentPath: '/vuesi'
          }
        }
    }))
  }
})

describe('Plugin', () => {
  test('render:html hook', () => {
    // Arrange
    const nitroApp = {
      hooks: {
        hook: jest.fn((name, callback: any) => {
          if (name === 'render:html') {
            const html = {
              body: ['<div id="__nuxt">Content</div>'],
              head: ['<script class="__VUESI__">Script Content</script>']
            }

            const event: any = {
              node: {
                req: {
                  url: '/vuesi/page'
                }
              }
            }

            // Act
            callback(html, { event })

            // Assert
            expect(event.vuesi.body).toBe('<div id="__nuxt">Content</div><script type="text/javascript">Script Content</script>')
          }
        })
      }
    }

    // Act
    plugin(nitroApp)

    // Assert
    expect(nitroApp.hooks.hook).toHaveBeenCalledWith('render:html', expect.any(Function))
  })

  test('render:response hook', () => {
    // Arrange
    const nitroApp = {
      hooks: {
        hook: jest.fn((name, callback: any) => {
          if (name === 'render:response') {
            const response: any = {}
            const event: any = {
              node: {
                req: {
                  url: '/vuesi/page'
                }
              },
              vuesi: {
                body: '<div id="__nuxt">Content</div><script type="text/javascript">Script Content</script>'
              }
            }

            // Act
            callback(response, { event })

            // Assert
            expect(response.body).toBe(event.vuesi.body)
          }
        })
      }
    }

    // Act
    plugin(nitroApp)

    // Assert
    expect(nitroApp.hooks.hook).toHaveBeenCalledWith('render:response', expect.any(Function))
  })
})
