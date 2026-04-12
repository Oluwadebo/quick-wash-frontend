export type TrustAction = 
  | 'SUCCESSFUL_ORDER' 
  | 'FIVE_STAR_REVIEW' 
  | 'CANCEL_AFTER_READY' 
  | 'CUSTOMER_NOT_AVAILABLE' 
  | 'LATE_DELIVERY' 
  | 'FAKE_DISPUTE' 
  | 'RIDER_ABANDONS' 
  | 'VENDOR_DELAY' 
  | 'REPEATED_CANCELLATION'
  | 'GOOD_BEHAVIOR_MONTHLY';

export const TRUST_POINTS_TABLE: Record<TrustAction, number> = {
  SUCCESSFUL_ORDER: 5,
  FIVE_STAR_REVIEW: 8,
  CANCEL_AFTER_READY: -10,
  CUSTOMER_NOT_AVAILABLE: -8,
  LATE_DELIVERY: -10,
  FAKE_DISPUTE: -20,
  RIDER_ABANDONS: -15,
  VENDOR_DELAY: -12,
  REPEATED_CANCELLATION: -25,
  GOOD_BEHAVIOR_MONTHLY: 10
};

export function calculateNewTrustPoints(currentPoints: number, action: TrustAction): number {
  const change = TRUST_POINTS_TABLE[action];
  const newPoints = Math.min(100, Math.max(0, currentPoints + change));
  return newPoints;
}

export function getTrustStatus(points: number) {
  if (points < 30) return { label: 'Suspended', color: 'text-error', restricted: true };
  if (points < 50) return { label: 'Restricted', color: 'text-warning', restricted: true };
  if (points >= 80) return { label: 'Elite', color: 'text-tertiary', restricted: false };
  return { label: 'Standard', color: 'text-primary', restricted: false };
}
