// localStorage polyfill for @vue/devtools-kit compatibility with Node 25+
// Node 25 has a localStorage global but without getItem/setItem methods (requires --localstorage-file flag).
// @vue/devtools-kit accesses localStorage at module-load time. We must patch it before any imports.
if (typeof globalThis.localStorage === 'undefined' || typeof globalThis.localStorage.getItem !== 'function') {
  const store = {}
  Object.defineProperty(globalThis, 'localStorage', {
    configurable: true,
    value: {
      getItem: (key) => store[key] ?? null,
      setItem: (key, value) => { store[key] = String(value) },
      removeItem: (key) => { delete store[key] },
      clear: () => { for (const k in store) delete store[k] },
      key: (index) => Object.keys(store)[index] ?? null,
      get length() { return Object.keys(store).length }
    }
  })
}