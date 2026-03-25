import { PrismaClient } from '@prisma/client';
import { logger } from '@/utils/logger';

export const prisma = new PrismaClient();

export const connectDatabase = async () => {
  try {
    await prisma.$connect();
    logger.info('Prisma connected to database successfully');
  } catch (error) {
    logger.error('Failed to connect to database:', error);
    process.exit(1);
  }
};
