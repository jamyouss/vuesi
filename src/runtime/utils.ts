export const getScript = (id: string, props: { [key: string]: any }) => {
  return {
    class: '__VUESI__',
    innerHTML: `window.__VUESI__ = window.__VUESI__ || {};window.__VUESI__['${id}']=${JSON.stringify(props)};document.currentScript.remove()`
  }
}
