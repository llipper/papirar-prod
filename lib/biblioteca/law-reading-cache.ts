import type { LawReading } from "./reading-service"

const DATABASE_NAME = "papirar-reading-cache"
const STORE_NAME = "law-readings"
const DATABASE_VERSION = 1
// Incrementar quando a estrutura remota de uma lei for ampliada e o cache
// anterior puder não conter os novos títulos, capítulos ou seções.
const CACHE_CONTENT_REVISION = "2026-08-26-02"

type CachedLawReading = {
  key: string
  savedAt: number
  reading: LawReading
}

const memoryCache = new Map<string, CachedLawReading>()

export function createLawReadingCacheKey(lawId: string, version: string, scope: string) {
  return `${CACHE_CONTENT_REVISION}::${lawId}::${version}::${scope}`
}

function canUseIndexedDb() {
  return typeof window !== "undefined" && "indexedDB" in window
}

function openDatabase(): Promise<IDBDatabase | null> {
  if (!canUseIndexedDb()) return Promise.resolve(null)

  return new Promise((resolve) => {
    const request = window.indexedDB.open(DATABASE_NAME, DATABASE_VERSION)
    request.onerror = () => resolve(null)
    request.onsuccess = () => resolve(request.result)
    request.onupgradeneeded = () => {
      request.result.createObjectStore(STORE_NAME, { keyPath: "key" })
    }
  })
}

export async function readCachedLawReading(key: string) {
  const memoryValue = memoryCache.get(key)
  if (memoryValue) return memoryValue

  const database = await openDatabase()
  if (!database) return undefined

  return new Promise<CachedLawReading | undefined>((resolve) => {
    const transaction = database.transaction(STORE_NAME, "readonly")
    const request = transaction.objectStore(STORE_NAME).get(key)
    request.onerror = () => resolve(undefined)
    request.onsuccess = () => {
      const value = request.result as CachedLawReading | undefined
      if (value) memoryCache.set(key, value)
      resolve(value)
    }
    transaction.oncomplete = () => database.close()
    transaction.onerror = () => database.close()
  })
}

export async function writeCachedLawReading(key: string, reading: LawReading) {
  const value: CachedLawReading = { key, savedAt: Date.now(), reading }
  memoryCache.set(key, value)

  const database = await openDatabase()
  if (!database) return

  await new Promise<void>((resolve) => {
    const transaction = database.transaction(STORE_NAME, "readwrite")
    transaction.objectStore(STORE_NAME).put(value)
    transaction.oncomplete = () => {
      database.close()
      resolve()
    }
    transaction.onerror = () => {
      database.close()
      resolve()
    }
  })
}
