import { PrismaClient } from '@prisma/client';
import { logger } from '@/utils/logger';

const prisma = new PrismaClient();

export class HeartbeatService {
  /**
   * Record a heartbeat for a wallet
   */
  async recordHeartbeat(
    walletId: string,
    userId: string,
    ipAddress?: string,
    userAgent?: string
  ): Promise<void> {
    try {
      await prisma.heartbeat.create({
        data: {
          walletId,
          userId,
          ipAddress,
          userAgent,
        },
      });

      logger.info(`Heartbeat recorded for wallet ${walletId} by user ${userId}`);
    } catch (error) {
      logger.error('Error recording heartbeat:', error);
      throw new Error('Failed to record heartbeat');
    }
  }

  /**
   * Get last heartbeat for a wallet
   */
  async getLastHeartbeat(walletId: string): Promise<Date | null> {
    try {
      const heartbeat = await prisma.heartbeat.findFirst({
        where: { walletId },
        orderBy: { timestamp: 'desc' },
      });

      return heartbeat ? heartbeat.timestamp : null;
    } catch (error) {
      logger.error('Error fetching last heartbeat:', error);
      return null;
    }
  }

  /**
   * Get heartbeat history
   */
  async getHeartbeatHistory(walletId: string, limit: number = 10): Promise<any[]> {
    try {
      return await prisma.heartbeat.findMany({
        where: { walletId },
        orderBy: { timestamp: 'desc' },
        take: limit,
        include: {
          wallet: {
            select: {
              name: true,
            },
          },
        },
      });
    } catch (error) {
      logger.error('Error fetching heartbeat history:', error);
      return [];
    }
  }

  /**
   * Calculate time until recovery unlocks
   */
  async getTimeUntilRecoveryUnlock(walletId: string, recoveryDelay: number): Promise<{
    secondsRemaining: number;
    daysRemaining: number;
    percentageComplete: number;
    isUnlocked: boolean;
  }> {
    try {
      const lastHeartbeat = await this.getLastHeartbeat(walletId);
      
      if (!lastHeartbeat) {
        // No heartbeat recorded, assume full time remaining
        return {
          secondsRemaining: recoveryDelay,
          daysRemaining: recoveryDelay / 86400,
          percentageComplete: 0,
          isUnlocked: false,
        };
      }

      const now = new Date();
      const unlockTime = new Date(lastHeartbeat.getTime() + recoveryDelay * 1000);
      const timeDiff = unlockTime.getTime() - now.getTime();

      if (timeDiff <= 0) {
        return {
          secondsRemaining: 0,
          daysRemaining: 0,
          percentageComplete: 100,
          isUnlocked: true,
        };
      }

      const percentageComplete = ((now.getTime() - lastHeartbeat.getTime()) / (recoveryDelay * 1000)) * 100;

      return {
        secondsRemaining: Math.floor(timeDiff / 1000),
        daysRemaining: timeDiff / (1000 * 60 * 60 * 24),
        percentageComplete: Math.min(percentageComplete, 100),
        isUnlocked: false,
      };
    } catch (error) {
      logger.error('Error calculating recovery unlock time:', error);
      return {
        secondsRemaining: 0,
        daysRemaining: 0,
        percentageComplete: 0,
        isUnlocked: false,
      };
    }
  }
}
