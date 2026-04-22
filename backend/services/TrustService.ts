import User from '../models/User.js';

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

export class TrustService {
  static async adjustPoints(uid: string, action: TrustAction) {
    const user = await User.findOne({ uid });
    if (!user) return;

    const change = TRUST_POINTS_TABLE[action];
    const newPoints = Math.min(100, Math.max(0, user.trustPoints + change));
    
    user.trustPoints = newPoints;
    user.trustScore = newPoints; // Sync score for now

    // Update status based on points
    if (newPoints < 30) {
      user.status = 'suspended';
    } else if (newPoints < 50) {
      user.status = 'restricted';
      if (!user.restrictionExpires) {
        user.restrictionExpires = new Date(Date.now() + 2 * 24 * 60 * 60 * 1000); // 2 day ban
      }
    } else {
      user.status = 'active';
      user.restrictionExpires = undefined;
    }

    if (change < 0) {
      user.lastPenaltyAt = new Date();
    }

    await user.save();
    return user;
  }
}
