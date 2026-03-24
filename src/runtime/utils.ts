export const getScript = (id: string, props: Record<string, unknown>) => {
  const serialized = JSON.stringify(props).replace(/</g, '\\u003c')

  return {
    class: '__VUESI__',
    innerHTML: `window.__VUESI__ = window.__VUESI__ || {};window.__VUESI__['${id}']=${serialized};document.currentScript.remove()`
  }
}
