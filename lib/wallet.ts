export interface WalletTransaction {
  id: string;
  amount: number;
  type: 'credit' | 'debit';
  description: string;
  timestamp: string;
}

export const PLATFORM_COMMISSION = 0.10; // 10%
export const SERVICE_FEE = 300; // ₦300

export function calculatePayout(totalAmount: number): number {
  const commission = totalAmount * PLATFORM_COMMISSION;
  return totalAmount - commission - SERVICE_FEE;
}

export const RIDER_MIN_WITHDRAWAL = 2000;
export const VENDOR_MIN_WITHDRAWAL = 8000;
export const RIDER_MAX_DEBT = -500;
