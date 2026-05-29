// localStorage polyfill for @vue/devtools-kit compatibility with Node 25+
// Node 25 removed the accidental localStorage global that existed in earlier versions.
// @vue/devtools-kit accesses localStorage at module-load time, which crashes in Node 25.
// This script must be loaded BEFORE vite processes the config file.
if (typeof globalThis.localStorage === 'undefined') {
  const store: Record<string, string> = {}
  globalThis.localStorage = {
    getItem: (key: string) => store[key] ?? null,
    setItem: (key: string, value: string) => { store[key] = value },
    removeItem: (key: string) => { delete store[key] },
    clear: () => { for (const k in store) delete store[k] },
    key: (index: number) => Object.keys(store)[index] ?? null,
    get length() { return Object.keys(store).length }
  } as Storage
}