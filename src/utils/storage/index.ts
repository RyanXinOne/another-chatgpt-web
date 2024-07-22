interface StorageData<T = any> {
  data: T
  expire: number | null
}

function createStorage(storage: Storage, options?: { expire?: number | null }) {
  const DEFAULT_CACHE_TIME = 60 * 60 * 24 * 7

  const { expire } = Object.assign({ expire: DEFAULT_CACHE_TIME }, options)

  function set<T = any>(key: string, data: T) {
    const storageData: StorageData<T> = {
      data,
      expire: expire !== null ? new Date().getTime() + expire * 1000 : null,
    }

    const json = JSON.stringify(storageData)
    storage.setItem(key, json)
  }

  function get(key: string) {
    const json = storage.getItem(key)
    if (json) {
      let storageData: StorageData | null = null

      try {
        storageData = JSON.parse(json)
      }
      catch {
        // Prevent failure
      }

      if (storageData) {
        const { data, expire } = storageData
        if (expire === null || expire >= Date.now())
          return data
      }

      remove(key)
      return null
    }
  }

  function remove(key: string) {
    storage.removeItem(key)
  }

  function clear() {
    storage.clear()
  }

  return { set, get, remove, clear }
}

export const ls = createStorage(window.localStorage, { expire: null })
export const ss = createStorage(window.sessionStorage, { expire: null })
