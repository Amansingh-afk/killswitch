import Redis from 'ioredis';

let redis: Redis | null = null;

export function getRedisClient(): Redis {
  if (!redis) {
    redis = new Redis(process.env.REDIS_URL || 'redis://localhost:6379', {
      maxRetriesPerRequest: 3,
      retryStrategy: (times) => {
        const delay = Math.min(times * 50, 2000);
        return delay;
      },
    });

    redis.on('error', (err) => {
      console.error('Redis Client Error:', err);
    });
  }

  return redis;
}

export async function acquireLock(key: string, ttl: number = 30): Promise<boolean> {
  const client = getRedisClient();
  const result = await client.set(key, '1', 'EX', ttl, 'NX');
  return result === 'OK';
}

export async function releaseLock(key: string): Promise<void> {
  const client = getRedisClient();
  await client.del(key);
}

// Calculate seconds until next market open (9:15 AM IST)
function getSecondsUntilNextMarketOpen(): number {
  const now = new Date();
  const istOffset = 5.5 * 60 * 60 * 1000;
  const istNow = new Date(now.getTime() + istOffset);
  
  const nextOpen = new Date(istNow);
  nextOpen.setUTCHours(3, 45, 0, 0); // 9:15 AM IST = 3:45 AM UTC
  
  if (istNow.getUTCHours() > 3 || (istNow.getUTCHours() === 3 && istNow.getUTCMinutes() >= 45)) {
    nextOpen.setUTCDate(nextOpen.getUTCDate() + 1);
  }
  
  const diffMs = nextOpen.getTime() - now.getTime();
  return Math.max(Math.floor(diffMs / 1000), 3600);
}

const SOD_CACHE_PREFIX = 'sod_balance:';

export async function getCachedSodBalance(dhanClientId: string): Promise<number | null> {
  try {
    const client = getRedisClient();
    const cached = await client.get(`${SOD_CACHE_PREFIX}${dhanClientId}`);
    if (cached !== null) {
      return parseFloat(cached);
    }
    return null;
  } catch {
    return null;
  }
}

export async function setCachedSodBalance(dhanClientId: string, sodLimit: number): Promise<void> {
  try {
    const client = getRedisClient();
    const ttl = getSecondsUntilNextMarketOpen();
    await client.set(`${SOD_CACHE_PREFIX}${dhanClientId}`, sodLimit.toString(), 'EX', ttl);
  } catch {
    // Silently fail - cache is optimization, not critical
  }
}

export async function invalidateSodCache(dhanClientId: string): Promise<void> {
  try {
    const client = getRedisClient();
    await client.del(`${SOD_CACHE_PREFIX}${dhanClientId}`);
  } catch {
    // Silently fail
  }
}

