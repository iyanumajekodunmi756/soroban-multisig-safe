import { PrismaClient, Transaction, Comment } from '@prisma/client';
import { CreateTransactionRequest } from '@/types/transaction';
import { StellarService } from '@/services/StellarService';

export class TransactionService {
  private prisma: PrismaClient;
  private stellarService: StellarService;

  constructor() {
    this.prisma = new PrismaClient();
    this.stellarService = new StellarService();
  }

  /**
   * Create a new transaction with off-chain metadata
   */
  async createTransaction(
    walletId: string,
    transactionData: CreateTransactionRequest & { transactionId: bigint }
  ): Promise<Transaction> {
    try {
      const transaction = await this.prisma.transaction.create({
        data: {
          walletId,
          transactionId: transactionData.transactionId,
          destination: transactionData.destination,
          amount: BigInt(transactionData.amount),
          data: transactionData.data,
          title: transactionData.title,
          description: transactionData.description,
          expiresAt: new Date(transactionData.expiresAt),
        },
      });

      return transaction;
    } catch (error) {
      console.error('Error creating transaction:', error);
      throw new Error('Failed to create transaction');
    }
  }

  /**
   * Update metadata for an existing transaction
   */
  async updateTransactionMetadata(
    id: string,
    metadata: { title?: string; description?: string }
  ): Promise<Transaction | null> {
    try {
      return await this.prisma.transaction.update({
        where: { id, isDeleted: false },
        data: metadata,
      });
    } catch (error) {
      console.error('Error updating transaction metadata:', error);
      throw new Error('Failed to update transaction metadata');
    }
  }

  /**
   * Get transaction with metadata and comments
   */
  async getTransactionById(id: string): Promise<Transaction & { comments: Comment[] } | null> {
    try {
      const transaction = await this.prisma.transaction.findFirst({
        where: {
          id,
          isDeleted: false,
        },
        include: {
          comments: {
            include: {
              user: {
                select: {
                  id: true,
                  stellarAddress: true,
                  email: true,
                },
              },
            },
            orderBy: {
              createdAt: 'asc',
            },
          },
          signatures_rel: true,
          wallet: {
            include: {
              owners: true,
            },
          },
        },
      });

      return transaction as any;
    } catch (error) {
      console.error('Error fetching transaction:', error);
      throw new Error('Failed to fetch transaction');
    }
  }

  /**
   * Get all transactions with search filter
   */
  async getTransactions(
    page: number = 1,
    limit: number = 10,
    search?: string,
    status?: string
  ): Promise<{
    transactions: Transaction[];
    total: number;
    page: number;
    totalPages: number;
  }> {
    try {
      const skip = (page - 1) * limit;

      const whereClause: any = {
        isDeleted: false,
        OR: search ? [
          { title: { contains: search, mode: 'insensitive' } },
          { description: { contains: search, mode: 'insensitive' } },
        ] : undefined,
      };

      if (status) {
        if (status === 'executed') whereClause.executed = true;
        if (status === 'pending') whereClause.executed = false;
      }

      const [transactions, total] = await Promise.all([
        this.prisma.transaction.findMany({
          where: whereClause,
          orderBy: {
            createdAt: 'desc',
          },
          skip,
          take: limit,
        }),
        this.prisma.transaction.count({
          where: whereClause,
        }),
      ]);

      return {
        transactions,
        total,
        page,
        totalPages: Math.ceil(total / limit),
      };
    } catch (error) {
      console.error('Error fetching transactions:', error);
      throw new Error('Failed to fetch transactions');
    }
  }

  /**
   * Add a comment to a transaction
   */
  async addComment(transactionId: string, userId: string, content: string): Promise<Comment> {
    try {
      const comment = await this.prisma.comment.create({
        data: {
          transactionId,
          userId,
          content,
        },
        include: {
          user: {
            select: {
              id: true,
              stellarAddress: true,
              email: true,
            },
          },
        },
      });

      return comment;
    } catch (error) {
      console.error('Error adding comment:', error);
      throw new Error('Failed to add comment');
    }
  }

  /**
   * Soft-delete a transaction
   */
  async softDeleteTransaction(id: string): Promise<void> {
    try {
      await this.prisma.transaction.update({
        where: { id },
        data: { isDeleted: true },
      });
    } catch (error) {
      console.error('Error deleting transaction:', error);
      throw new Error('Failed to delete transaction');
    }
  }

  /**
   * Verify if a user is a signer for the wallet associated with the transaction
   */
  async isUserSigner(transactionId: string, userId: string): Promise<boolean> {
    try {
      const transaction = await this.prisma.transaction.findUnique({
        where: { id: transactionId },
        include: {
          wallet: {
            include: {
              owners: true,
            },
          },
        },
      });

      if (!transaction) return false;

      const user = await this.prisma.user.findUnique({
        where: { id: userId },
      });

      if (!user) return false;

      return transaction.wallet.owners.some(owner => owner.address === user.stellarAddress);
    } catch (error) {
      console.error('Error verifying signer status:', error);
      return false;
    }
  }
}
