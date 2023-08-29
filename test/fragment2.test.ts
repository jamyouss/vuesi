import { mount } from '@vue/test-utils'
import { jest, describe, expect, it } from '@jest/globals'
import MyDynamicComponent from '../playground/components/Welcome.vue'
import { mockNuxtImport } from '@nuxt/test-utils/runtime'

mockNuxtImport('useRoute', () => {
  return () => {
    return jest.fn().mockReturnValue({
      query: {
        component: 'mocked-component-path',
        props: '{}'
      }
    })
  }
})

mockNuxtImport('useHead', () => {
  return () => {
    return jest.fn()
  }
})

mockNuxtImport('useRequestEvent', () => {
  return () => {
    return jest.fn().mockReturnValue('mocked-event')
  }
})

// Mock dependencies
jest.mock('uuid', () => ({
  v5: jest.fn().mockReturnValue('mocked-uuid')
}))

jest.mock('h3', () => ({
  appendResponseHeader: jest.fn()
}))

jest.mock('../src/runtime/utils', () => ({
  getScript: jest.fn().mockReturnValue('mocked-script')
}))

// jest.mock('#imports', () => ({
//   useRoute: jest.fn().mockReturnValue({
//     query: {
//       component: 'mocked-component-path',
//       props: '{}'
//     }
//   }),
//   useHead: jest.fn(),
//   useRequestEvent: jest.fn().mockReturnValue('mocked-event')
// }))

describe('MyDynamicComponent', () => {
  it('renders the dynamic component with props', async () => {
    const wrapper = mount(MyDynamicComponent)
    await wrapper.vm.$nextTick()

    // Assert that the dynamic component is rendered
    expect(wrapper.findComponent({ name: 'mocked-component-name' }).exists()).toBe(true)

    // Assert that props are passed correctly
    expect(wrapper.findComponent({ name: 'mocked-component-name' }).props()).toEqual({})

    // Assert that useHead is called with correct arguments
    // expect(useHead).toHaveBeenCalledWith({
    //   script: ['mocked-script']
    // })

    // Assert that appendResponseHeader is called with correct arguments
    expect(appendResponseHeader).toHaveBeenCalledWith('mocked-event', 'cache-control', undefined)
  })

  it('renders the dynamic component with cached props and cache-control header', async () => {
    // Mocking cached props and cache-control header
    jest.spyOn(JSON, 'parse').mockReturnValueOnce({ cachedProp: 'cachedValue' })
    const cacheControlValue = 'max-age=3600'
    const mockedUseRoute = jest.fn().mockReturnValue({
      query: {
        component: 'mocked-component-path',
        props: '{"cachedProp":"cachedValue"}'
      }
    })
    jest.mock('#imports', () => ({
      useRoute: mockedUseRoute,
      useHead: jest.fn(),
      useRequestEvent: jest.fn().mockReturnValue('mocked-event')
    }))
    jest.spyOn(MyDynamicComponent.__esModule, 'default').mockResolvedValueOnce({
      Vuesi: {
        props: jest.fn().mockResolvedValueOnce({} as never),
        cacheControl: cacheControlValue
      }
    })

    const wrapper = mount(MyDynamicComponent)
    await wrapper.vm.$nextTick()

    // Assert that the dynamic component is rendered
    expect(wrapper.findComponent({ name: 'mocked-component-name' }).exists()).toBe(true)

    // Assert that props are passed correctly
    expect(wrapper.findComponent({ name: 'mocked-component-name' }).props()).toEqual({ cachedProp: 'cachedValue' })

    // Assert that useHead is called with correct arguments
    // expect(useHead).toHaveBeenCalledWith({
    //   script: ['mocked-script']
    // })

    // Assert that appendResponseHeader is called with correct arguments
    expect(appendResponseHeader).toHaveBeenCalledWith('mocked-event', 'cache-control', cacheControlValue)
  })
})
