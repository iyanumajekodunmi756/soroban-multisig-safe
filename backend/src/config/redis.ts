import { createClient } from 'redis';
import { logger } from '@/utils/logger';

const redisUrl = process.env.REDIS_URL || 'redis://localhost:6379';
export const redisClient = createClient({ url: redisUrl });

redisClient.on('error', (err) => logger.error('Redis Client Error:', err));

export const connectRedis = async () => {
  try {
    await redisClient.connect();
    logger.info('Redis connected successfully');
  } catch (error) {
    logger.error('Failed to connect to Redis:', error);
    // Redis might be optional depending on the requirements, but index.ts expects it.
    // In many setups, if Redis is missing, we still continue if it's just for caching.
    // But index.ts calls it in startServer.
  }
};
