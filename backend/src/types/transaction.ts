export interface CreateTransactionRequest {
  walletId: string;
  destination: string;
  amount: string;
  data?: string;
  title?: string;
  description?: string;
  expiresAt: string;
}

export interface UpdateTransactionRequest {
  title?: string;
  description?: string;
  isDeleted?: boolean;
}

export interface AddCommentRequest {
  content: string;
}

export interface TransactionsResponse {
  transactions: any[];
  total: number;
  page: number;
  totalPages: number;
}
