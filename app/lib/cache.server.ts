import Redis from "ioredis";

declare global {
  var __redis: Redis | undefined;
}

function getRedisClient(): Redis {
  if (!globalThis.__redis) {
    const redisUrl = process.env.REDIS_URL || "redis://localhost:6379";
    globalThis.__redis = new Redis(redisUrl, {
      maxRetriesPerRequest: 3,
      lazyConnect: true,
    });

    globalThis.__redis.on("error", (err) => {
      console.error("Redis connection error:", err);
    });
  }
  return globalThis.__redis;
}

export const redis = getRedisClient();

// Cache helper functions
export async function getCache<T>(key: string): Promise<T | null> {
  try {
    const data = await redis.get(key);
    if (!data) return null;
    return JSON.parse(data) as T;
  } catch {
    return null;
  }
}

export async function setCache(key: string, value: unknown, ttlSeconds: number = 300): Promise<void> {
  try {
    await redis.setex(key, ttlSeconds, JSON.stringify(value));
  } catch (err) {
    console.error("Cache set error:", err);
  }
}

export async function deleteCache(key: string): Promise<void> {
  try {
    await redis.del(key);
  } catch (err) {
    console.error("Cache delete error:", err);
  }
}

export async function deleteCachePattern(pattern: string): Promise<void> {
  try {
    const keys = await redis.keys(pattern);
    if (keys.length > 0) {
      await redis.del(...keys);
    }
  } catch (err) {
    console.error("Cache pattern delete error:", err);
  }
}

// Cache keys
export const cacheKeys = {
  project: (slug: string) => `project:${slug}`,
  projectChangelogs: (slug: string) => `project:${slug}:changelogs`,
  changelog: (projectId: string, version: string) => `changelog:${projectId}:${version}`,
  analytics: (projectId: string) => `analytics:${projectId}`,
};

