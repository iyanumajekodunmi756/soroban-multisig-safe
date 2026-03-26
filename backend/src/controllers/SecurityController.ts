import { Request, Response } from 'express';
import { HeartbeatService } from '@/services/HeartbeatService';
import { WalletService } from '@/services/WalletService';
import { ApiResponse } from '@/types/api';
import { validationResult } from 'express-validator';
import { logger } from '@/utils/logger';

export class SecurityController {
  private heartbeatService: HeartbeatService;
  private walletService: WalletService;

  constructor() {
    this.heartbeatService = new HeartbeatService();
    this.walletService = new WalletService();
  }

  /**
   * Send heartbeat (I am here button)
   */
  async sendHeartbeat(req: Request, res: Response): Promise<void> {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        res.status(400).json({
          success: false,
          error: {
            code: 'VALIDATION_ERROR',
            message: 'Invalid input data',
            details: errors.array(),
          },
        });
        return;
      }

      const { walletId } = req.params;
      const userId = req.user!.id;
      const ipAddress = req.ip;
      const userAgent = req.headers['user-agent'];

      await this.heartbeatService.recordHeartbeat(walletId, userId, ipAddress || undefined, userAgent as string);

      const response: ApiResponse = {
        success: true,
        message: 'Heartbeat sent successfully',
      };

      res.json(response);
    } catch (error) {
      logger.error('Error sending heartbeat:', error);
      res.status(500).json({
        success: false,
        error: {
          code: 'HEARTBEAT_SEND_FAILED',
          message: 'Failed to send heartbeat',
        },
      });
    }
  }

  /**
   * Get recovery status
   */
  async getRecoveryStatus(req: Request, res: Response): Promise<void> {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        res.status(400).json({
          success: false,
          error: {
            code: 'VALIDATION_ERROR',
            message: 'Invalid input data',
            details: errors.array(),
          },
        });
        return;
      }

      const { walletId } = req.params;
      const userId = req.user!.id;

      const wallet = await this.walletService.getWalletById(walletId, userId);
      if (!wallet) {
        res.status(404).json({
          success: false,
          error: {
            code: 'WALLET_NOT_FOUND',
            message: 'Wallet not found',
          },
        });
        return;
      }

      const recoveryDelay = Number(wallet.recoveryDelay);
      const unlockInfo = await this.heartbeatService.getTimeUntilRecoveryUnlock(walletId, recoveryDelay);
      const lastHeartbeat = await this.heartbeatService.getLastHeartbeat(walletId);

      const response: ApiResponse = {
        success: true,
        data: {
          recoveryAddress: wallet.recoveryAddress,
          recoveryDelaySeconds: recoveryDelay,
          lastHeartbeat: lastHeartbeat?.toISOString() || null,
          ...unlockInfo,
          daysRemainingFormatted: unlockInfo.daysRemaining.toFixed(1),
          isLessThan7Days: unlockInfo.daysRemaining < 7 && !unlockInfo.isUnlocked,
        },
      };

      res.json(response);
    } catch (error) {
      logger.error('Error fetching recovery status:', error);
      res.status(500).json({
        success: false,
        error: {
          code: 'RECOVERY_STATUS_FETCH_FAILED',
          message: 'Failed to fetch recovery status',
        },
      });
    }
  }

  /**
   * Get heartbeat history
   */
  async getHeartbeatHistory(req: Request, res: Response): Promise<void> {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        res.status(400).json({
          success: false,
          error: {
            code: 'VALIDATION_ERROR',
            message: 'Invalid input data',
            details: errors.array(),
          },
        });
        return;
      }

      const { walletId } = req.params;
      const limit = parseInt(req.query.limit as string) || 20;

      const history = await this.heartbeatService.getHeartbeatHistory(walletId, limit);

      const response: ApiResponse = {
        success: true,
        data: {
          heartbeats: history.map(h => ({
            id: h.id,
            timestamp: h.timestamp.toISOString(),
            walletName: h.wallet.name,
          })),
        },
      };

      res.json(response);
    } catch (error) {
      logger.error('Error fetching heartbeat history:', error);
      res.status(500).json({
        success: false,
        error: {
          code: 'HEARTBEAT_HISTORY_FETCH_FAILED',
          message: 'Failed to fetch heartbeat history',
        },
      });
    }
  }
}
