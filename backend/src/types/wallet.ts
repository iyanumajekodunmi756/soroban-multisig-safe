export interface CreateWalletRequest {
  name: string;
  owners: string[];
  threshold: number;
  recoveryAddress: string;
  recoveryDelay: number;
}

export interface UpdateWalletRequest {
  name?: string;
}

export interface WalletResponse {
  id: string;
  name: string;
  contractAddress: string;
  stellarNetwork: string;
  threshold: number;
  recoveryAddress: string;
  recoveryDelay: bigint;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}
