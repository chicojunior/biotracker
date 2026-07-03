import '@testing-library/jest-dom/vitest';

// Node >= 22 exposes an experimental `localStorage` global that is
// non-functional unless the process runs with `--localstorage-file`, and it
// shadows jsdom's implementation inside the Vitest environment. Rebuild Web
// Storage over an in-memory backing store, keeping the methods on
// `Storage.prototype` so tests can spy on them
// (e.g. vi.spyOn(Storage.prototype, 'setItem')).

const backingStores = new WeakMap<Storage, Map<string, string>>();

function backingStore(storage: Storage): Map<string, string> {
  let store = backingStores.get(storage);

  if (!store) {
    store = new Map();
    backingStores.set(storage, store);
  }

  return store;
}

Object.defineProperties(Storage.prototype, {
  length: {
    configurable: true,
    get(this: Storage) {
      return backingStore(this).size;
    },
  },
  key: {
    configurable: true,
    writable: true,
    value(this: Storage, index: number): string | null {
      return Array.from(backingStore(this).keys())[index] ?? null;
    },
  },
  getItem: {
    configurable: true,
    writable: true,
    value(this: Storage, key: string): string | null {
      return backingStore(this).get(String(key)) ?? null;
    },
  },
  setItem: {
    configurable: true,
    writable: true,
    value(this: Storage, key: string, value: string): void {
      backingStore(this).set(String(key), String(value));
    },
  },
  removeItem: {
    configurable: true,
    writable: true,
    value(this: Storage, key: string): void {
      backingStore(this).delete(String(key));
    },
  },
  clear: {
    configurable: true,
    writable: true,
    value(this: Storage): void {
      backingStore(this).clear();
    },
  },
});

const memoryStorage: Storage = Object.create(Storage.prototype);

Object.defineProperty(globalThis, 'localStorage', {
  configurable: true,
  value: memoryStorage,
});

Object.defineProperty(window, 'localStorage', {
  configurable: true,
  value: memoryStorage,
});
