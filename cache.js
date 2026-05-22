class TTLCache {
  constructor(defaultTtlSeconds = 60) {
    this.defaultTtlMs = defaultTtlSeconds * 1000;
    this.store = new Map();
  }

  get(key) {
    const item = this.store.get(key);
    if (!item) return null;

    if (Date.now() > item.expiresAt) {
      this.store.delete(key);
      return null;
    }

    return item.value;
  }

  set(key, value, ttlSeconds) {
    const ttlMs = typeof ttlSeconds === "number" ? ttlSeconds * 1000 : this.defaultTtlMs;
    this.store.set(key, {
      value,
      expiresAt: Date.now() + ttlMs
    });
  }

  clear() {
    this.store.clear();
  }
}

module.exports = TTLCache;
