// Simple in-memory TTL cache for Tabspace API responses

interface CacheEntry<T> {
	data: T;
	expiresAt: number;
}

class MemoryCache {
	private cache = new Map<string, CacheEntry<any>>();
	private maxEntries: number;

	constructor(maxEntries = 500) {
		this.maxEntries = maxEntries;
	}

	get<T>(key: string): T | null {
		const entry = this.cache.get(key);
		if (!entry) return null;

		if (Date.now() > entry.expiresAt) {
			this.cache.delete(key);
			return null;
		}

		return entry.data as T;
	}

	set<T>(key: string, data: T, ttlMs: number): void {
		// Evict oldest if reaching capacity
		if (this.cache.size >= this.maxEntries) {
			const oldestKey = this.cache.keys().next().value;
			if (oldestKey) this.cache.delete(oldestKey);
		}

		this.cache.set(key, {
			data,
			expiresAt: Date.now() + ttlMs
		});
	}

	has(key: string): boolean {
		return this.get(key) !== null;
	}

	clear(): void {
		this.cache.clear();
	}
}

export const searchCache = new MemoryCache(200);
export const tabCache = new MemoryCache(500);
export const artistCache = new MemoryCache(200);
export const chartCache = new MemoryCache(50);
