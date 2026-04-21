/**
 * DatabaseService.ts
 * Abstracts localStorage to simulate a real asynchronous database with atomic transactions.
 */

export type TrustAction = 
  | 'completed_order' 
  | 'five_star_review' 
  | 'admin_good_performance' 
  | 'cancel_after_ready' 
  | 'customer_not_available' 
  | 'late_delivery' 
  | 'rider_abandon' 
  | 'vendor_delay' 
  | 'fake_dispute' 
  | 'repeated_cancellation'
  | 'rider_return_order';

export interface UserData {
  uid: string;
  fullName: string;
  phoneNumber: string;
  password?: string;
  role: 'customer' | 'vendor' | 'rider' | 'admin';
  isApproved: boolean;
  walletBalance: number;
  pendingBalance: number;
  withdrawalRequested?: boolean;
  trustPoints: number;
  trustScore: number;
  status: 'active' | 'restricted' | 'suspended';
  restrictionExpires?: string;
  lastPenaltyAt?: string;
  lastRecoveryAt?: string;
  shopName?: string;
  vehicleType?: string;
  nin?: string;
  whatsappNumber?: string;
  bankAccountName?: string;
  bankAccountNumber?: string;
  bankName?: string;
  turnaroundTime?: string;
  capacity?: number;
  address?: string;
  shopAddress?: string;
  landmark?: string;
}

export interface Order {
  id: string;
  customerUid: string;
  customerName: string;
  customerPhone: string;
  vendorId: string; // This is the vendor's UID
  vendorName: string;
  vendorPhone?: string;
  customerAddress?: string;
  customerLandmark?: string;
  vendorLandmark?: string;
  vendorAddress?: string;
  items: string;
  itemsPrice: number;
  riderFee: number;
  totalPrice: number;
  status: string;
  color: string;
  time: string;
  createdAt: string;
  riderUid?: string;
  riderName?: string;
  riderPhone?: string;
  pickupAddress?: string;
  code1?: string | null;
  code2?: string | null;
  code3?: string | null;
  code4?: string | null;
  handoverCode?: string | null;
  readyForDeliveryAt?: string | null;
  washingAt?: string | null;
  readyAt?: string | null;
  pickedUpAt?: string | null;
  pickedUpDeliveryAt?: string | null;
  paidAt?: string | null;
  deliveredAt?: string | null;
  completedAt?: string | null;
  penaltyApplied?: boolean;
  payoutReleased?: boolean;
  disputed?: boolean;
  evidenceImage?: string | null;
  vendorEvidenceImage?: string | null;
  refundAmount?: number;
  isLocked?: boolean;
  lockedBy?: string;
  lockExpires?: number;
  returnReason?: string;
  consecutiveReturns?: number;
  rating?: number;
  review?: string;
  ratedAt?: string;
}

export interface SiteSettings {
  name: string;
  logo: string;
  primaryColor: string;
  contactEmail: string;
  contactPhone: string;
  emergencyAlert: string;
  maintenanceMode: boolean;
  announcement: string;
}

const DELAY = 300; // Simulate network latency

class DatabaseService {
  private async delay() {
    return new Promise(resolve => setTimeout(resolve, DELAY));
  }

  // --- USERS ---

  async getUsers(): Promise<UserData[]> {
    await this.delay();
    return JSON.parse(localStorage.getItem('qw_all_users') || '[]');
  }

  async getUser(uid: string): Promise<UserData | null> {
    const users = await this.getUsers();
    return users.find(u => u.uid === uid) || null;
  }

  async updateUser(uid: string, data: Partial<UserData>): Promise<UserData> {
    const users = await this.getUsers();
    const index = users.findIndex(u => u.uid === uid);
    if (index === -1) throw new Error('User not found');
    
    // Cap trustPoints at 100
    if (data.trustPoints !== undefined) {
      data.trustPoints = Math.min(100, Math.max(0, data.trustPoints));
    }
    // Cap trustScore at 100
    if (data.trustScore !== undefined) {
      data.trustScore = Math.min(100, Math.max(0, data.trustScore));
    }
    
    users[index] = { ...users[index], ...data };
    
    // Check for status changes based on trust points
    const user = users[index];
    if (user.trustPoints < 10) {
      // High risk - Admin decision, but we'll flag it or keep as suspended
      user.status = 'suspended';
    } else if (user.trustPoints < 30) {
      user.status = 'suspended';
    } else if (user.trustPoints < 60) {
      user.status = 'restricted';
      // If not already restricted with an expiry, set a default 2-day restriction
      if (!user.restrictionExpires) {
        user.restrictionExpires = new Date(Date.now() + 2 * 24 * 60 * 60 * 1000).toISOString();
      }
    } else {
      // Check if restriction expired
      if (user.status === 'restricted' && user.restrictionExpires) {
        if (new Date().getTime() > new Date(user.restrictionExpires).getTime()) {
          user.status = 'active';
          user.restrictionExpires = undefined;
        }
      } else if (user.status === 'restricted' && !user.restrictionExpires) {
        user.status = 'active';
      }
    }

    localStorage.setItem('qw_all_users', JSON.stringify(users));
    
    // If updating current user, sync qw_user
    const currentUser = JSON.parse(localStorage.getItem('qw_user') || '{}');
    if (currentUser.uid === uid) {
      localStorage.setItem('qw_user', JSON.stringify(users[index]));
    }
    
    window.dispatchEvent(new Event('storage'));
    return users[index];
  }

  async deleteUser(uid: string): Promise<void> {
    await this.delay();
    const users = await this.getUsers();
    const updated = users.filter(u => u.uid !== uid);
    localStorage.setItem('qw_all_users', JSON.stringify(updated));
    window.dispatchEvent(new Event('storage'));
  }

  // --- ORDERS ---

  async getOrders(): Promise<Order[]> {
    await this.delay();
    return JSON.parse(localStorage.getItem('qw_orders') || '[]');
  }

  async getOrder(id: string): Promise<Order | null> {
    const orders = await this.getOrders();
    return orders.find(o => o.id === id) || null;
  }

  async saveOrder(order: Order): Promise<Order> {
    const orders = await this.getOrders();
    const index = orders.findIndex(o => o.id === order.id);
    if (index === -1) {
      orders.push(order);
    } else {
      orders[index] = order;
    }
    localStorage.setItem('qw_orders', JSON.stringify(orders));
    window.dispatchEvent(new Event('storage'));
    return order;
  }

  /**
   * Atomic Transaction: Claim Order
   * Uses a "First-to-Claim" lock mechanism to prevent double-claiming.
   */
  async claimOrder(orderId: string, riderUid: string, riderName: string, riderPhone: string): Promise<boolean> {
    await this.delay();
    
    // 1. Get current state
    const orders = JSON.parse(localStorage.getItem('qw_orders') || '[]');
    const orderIndex = orders.findIndex((o: any) => o.id === orderId);
    
    if (orderIndex === -1) return false;
    const order = orders[orderIndex];

    // 2. Check if already claimed or locked
    const now = Date.now();
    if (order.riderUid) return false; // Already claimed
    if (order.isLocked && order.lockExpires && order.lockExpires > now) return false; // Currently being processed by someone else

    // 3. Attempt to set lock (Atomic-ish for localStorage)
    order.isLocked = true;
    order.lockedBy = riderUid;
    order.lockExpires = now + 5000; // 5 second lock
    localStorage.setItem('qw_orders', JSON.stringify(orders));

    // 4. Re-verify after a short jitter to simulate race condition check
    await new Promise(resolve => setTimeout(resolve, 50));
    const recheckOrders = JSON.parse(localStorage.getItem('qw_orders') || '[]');
    const recheckOrder = recheckOrders.find((o: any) => o.id === orderId);
    
    if (recheckOrder.lockedBy !== riderUid) return false; // Someone else won the race

    // 5. Finalize claim
    recheckOrder.riderUid = riderUid;
    recheckOrder.riderName = riderName;
    recheckOrder.riderPhone = riderPhone;
    recheckOrder.isLocked = false;
    recheckOrder.lockedBy = undefined;
    recheckOrder.lockExpires = undefined;
    
    localStorage.setItem('qw_orders', JSON.stringify(recheckOrders));
    window.dispatchEvent(new Event('storage'));
    return true;
  }

  async updateOrderStatus(orderId: string, status: string, color: string, handoverCode?: string): Promise<Order> {
    const order = await this.getOrder(orderId);
    if (!order) throw new Error('Order not found');

    const currentUser = JSON.parse(localStorage.getItem('qw_user') || '{}');

    // Handover Code Validation for specific status transitions
    if (status === 'picked_up') {
      if (handoverCode !== order.code1) {
        throw new Error('Invalid pickup code');
      }
      order.pickedUpAt = new Date().toISOString();
      // Generate Code 2 for Vendor
      order.code2 = Math.floor(1000 + Math.random() * 9000).toString();

      // Rider gets first 50% fee
      if (order.riderUid) {
        const rider = await this.getUser(order.riderUid);
        if (rider) {
          const firstHalf = (order.riderFee || 0) * 0.5;
          await this.updateUser(rider.uid, { walletBalance: (rider.walletBalance || 0) + firstHalf });
          await this.recordTransaction(rider.uid, {
            type: 'deposit',
            amount: firstHalf,
            desc: `Rider Fee (50%) - Order #${order.id}`
          });
        }
      }
    }
    
    if (status === 'picked_up_delivery') {
      if (handoverCode !== order.code3) {
        throw new Error('Invalid handover code from vendor');
      }
      order.pickedUpDeliveryAt = new Date().toISOString();
      // Generate Code 4 for Customer
      order.code4 = Math.floor(1000 + Math.random() * 9000).toString();
    }

    if (status === 'delivered') {
      if (handoverCode !== order.code4) {
        throw new Error('Invalid delivery code');
      }
      order.deliveredAt = new Date().toISOString();

      // Rider gets second 50% fee
      if (order.riderUid) {
        const rider = await this.getUser(order.riderUid);
        if (rider) {
          const secondHalf = (order.riderFee || 0) * 0.5;
          await this.updateUser(rider.uid, { walletBalance: (rider.walletBalance || 0) + secondHalf });
          await this.recordTransaction(rider.uid, {
            type: 'deposit',
            amount: secondHalf,
            desc: `Rider Fee (2nd Half) - Order #${order.id}`
          });
          // Also trust points for successful delivery
          await this.adjustTrustPoints(rider.uid, 'completed_order');
        }
      }
    }
    
    order.status = status;
    order.color = color;
    
    // Track transitions
    if (status === 'washing') order.washingAt = new Date().toISOString();
    if (status === 'ready') order.readyAt = new Date().toISOString();
    if (status === 'completed') {
      order.completedAt = new Date().toISOString();
      // release payment if not already released (optional logic here)
    }
    
    return await this.saveOrder(order);
  }

  /**
   * Auto-cancel orders unassigned for > 20 mins
   */
  async runAutoCancel(): Promise<void> {
    const orders = await this.getOrders();
    const now = new Date().getTime();
    const twentyMins = 20 * 60 * 1000;
    let changed = false;

    // Filter unassigned orders older than 20 mins
    const updatedOrders = await Promise.all(orders.map(async (o) => {
      // unassigned implies rider_assign_pickup or rider_assign_delivery without a riderUid
      const isUnassigned = (o.status === 'rider_assign_pickup' || o.status === 'rider_assign_delivery') && !o.riderUid;
      if (isUnassigned && o.time) {
        const orderTime = new Date(o.time).getTime();
        if (now - orderTime > twentyMins && o.status !== 'cancelled') {
          // Cancel and Refund
          const customer = await this.getUser(o.customerUid);
          if (customer) {
            await this.updateUser(o.customerUid, {
              walletBalance: (customer.walletBalance || 0) + (o.totalPrice || 0)
            });
            await this.recordTransaction(o.customerUid, {
              type: 'deposit',
              amount: o.totalPrice,
              desc: `Order #${o.id} Refund - No rider available`
            });
          }
          o.status = 'cancelled';
          o.color = 'bg-error text-on-error';
          changed = true;
          console.log(`Auto-cancelled order ${o.id}`);
        }
      }
      return o;
    }));

    if (changed) {
      localStorage.setItem('qw_orders', JSON.stringify(updatedOrders));
      window.dispatchEvent(new Event('storage'));
    }
  }

  async adjustTrustPoints(uid: string, action: TrustAction): Promise<UserData> {
    const user = await this.getUser(uid);
    if (!user) throw new Error('User not found');

    let change = 0;
    let isPenalty = false;

    switch (action) {
      case 'completed_order': change = 5; break;
      case 'five_star_review': change = 8; break;
      case 'admin_good_performance': change = 10; break;
      case 'cancel_after_ready': change = -10; isPenalty = true; break;
      case 'customer_not_available': change = -8; isPenalty = true; break;
      case 'late_delivery': change = -10; isPenalty = true; break;
      case 'rider_abandon': change = -15; isPenalty = true; break;
      case 'vendor_delay': change = -12; isPenalty = true; break;
      case 'fake_dispute': change = -20; isPenalty = true; break;
      case 'rider_return_order': change = -5; isPenalty = true; break;
      case 'repeated_cancellation': 
        change = -25; 
        isPenalty = true;
        // Also add a 2-day ban
        const banExpiry = new Date(Date.now() + 2 * 24 * 60 * 60 * 1000).toISOString();
        return await this.updateUser(uid, { 
          trustPoints: user.trustPoints + change,
          status: 'restricted',
          restrictionExpires: banExpiry,
          lastPenaltyAt: new Date().toISOString()
        });
    }

    const update: Partial<UserData> = {
      trustPoints: user.trustPoints + change
    };

    if (isPenalty) {
      update.lastPenaltyAt = new Date().toISOString();
    }

    return await this.updateUser(uid, update);
  }

  async returnOrder(orderId: string, riderUid: string, reason: string): Promise<boolean> {
    const order = await this.getOrder(orderId);
    const rider = await this.getUser(riderUid);
    if (!order || !rider || order.riderUid !== riderUid) return false;

    // 1. Deduct ₦200 from wallet
    const penaltyFee = 200;
    const newBalance = Math.max(0, (rider.walletBalance || 0) - penaltyFee);
    
    // 2. Track consecutive returns
    const consecutiveReturns = (rider.consecutiveReturns || 0) + 1;
    
    let status = rider.status;
    let restrictionExpires = rider.restrictionExpires;

    // 3. Check for 5 consecutive returns -> 2 day suspension
    if (consecutiveReturns >= 5) {
      status = 'suspended';
      restrictionExpires = new Date(Date.now() + 2 * 24 * 60 * 60 * 1000).toISOString();
    }

    await this.updateUser(riderUid, {
      walletBalance: newBalance,
      consecutiveReturns: consecutiveReturns >= 5 ? 0 : consecutiveReturns, // Reset if suspended
      status,
      restrictionExpires
    });

    // 4. Deduct 5 trust points
    await this.adjustTrustPoints(riderUid, 'rider_return_order');

    // 5. Record transaction
    await this.recordTransaction(riderUid, {
      type: 'withdrawal',
      amount: penaltyFee,
      desc: `Order Return Penalty - Order #${orderId}`
    });

    // 6. Reset order status and codes
    const updatedOrder: Order = {
      ...order,
      status: order.status === 'picked_up' ? 'rider_assign_pickup' : 
              order.status === 'picked_up_delivery' ? 'rider_assign_delivery' : 
              order.status,
      riderUid: undefined,
      riderName: undefined,
      riderPhone: undefined,
      returnReason: reason,
      code2: null,
      code4: null,
      handoverCode: null,
      color: 'bg-warning/20 text-warning'
    };
    await this.saveOrder(updatedOrder);

    return true;
  }

  /**
   * Auto-recovery: +10 points every 27 days of good behavior (no penalties)
   */
  async processAutoRecovery(uid: string): Promise<void> {
    const user = await this.getUser(uid);
    if (!user || user.trustPoints >= 100) return;

    const now = new Date().getTime();
    const lastPenalty = user.lastPenaltyAt ? new Date(user.lastPenaltyAt).getTime() : 0;
    const lastRecovery = user.lastRecoveryAt ? new Date(user.lastRecoveryAt).getTime() : 0;
    
    const daysSincePenalty = (now - lastPenalty) / (24 * 60 * 60 * 1000);
    const daysSinceRecovery = (now - lastRecovery) / (24 * 60 * 60 * 1000);

    if (daysSincePenalty >= 27 && daysSinceRecovery >= 27) {
      await this.updateUser(uid, {
        trustPoints: user.trustPoints + 10,
        lastRecoveryAt: new Date().toISOString()
      });
    }
  }

  // --- WALLET ---
  async recordTransaction(uid: string, transaction: any) {
    const history = JSON.parse(localStorage.getItem(`qw_wallet_history_${uid}`) || '[]');
    history.unshift({ ...transaction, id: Math.random().toString(36).substr(2, 9), date: new Date().toISOString() });
    localStorage.setItem(`qw_wallet_history_${uid}`, JSON.stringify(history));
  }

  // --- RATINGS ---
  async rateOrder(orderId: string, rating: number, review: string): Promise<Order> {
    const order = await this.getOrder(orderId);
    if (!order) throw new Error('Order not found');

    const updated: Order = {
      ...order,
      rating,
      review,
      ratedAt: new Date().toISOString()
    };
    await this.saveOrder(updated);

    // Adjust vendor/rider trust points based on rating
    if (order.vendorId) {
      if (rating >= 4) await this.adjustTrustPoints(order.vendorId, 'five_star_review');
      if (rating <= 2) await this.adjustTrustPoints(order.vendorId, 'vendor_delay'); // Negative impact
    }
    
    if (order.riderUid && rating >= 4) {
      await this.adjustTrustPoints(order.riderUid, 'five_star_review');
    }

    return updated;
  }

  // --- ANALYTICS ---
  async getSystemStats() {
    const users = await this.getUsers();
    const orders = await this.getOrders();
    const now = new Date();
    const last24h = new Date(now.getTime() - 24 * 60 * 60 * 1000);

    const completed = orders.filter(o => o.status === 'completed' || o.status === 'delivered');
    const revenue = completed.reduce((acc, o) => acc + (o.totalPrice || 0), 0);
    const active = orders.filter(o => !['completed', 'cancelled', 'delivered'].includes(o.status.toLowerCase()));

    const hourlyVelocity = Array.from({ length: 12 }, (_, i) => {
      const h = new Date(now.getTime() - (11 - i) * 60 * 60 * 1000);
      const hStr = h.getHours() + ':00';
      const count = orders.filter(o => new Date(o.createdAt).getHours() === h.getHours()).length;
      return { time: hStr, orders: count };
    });

    return {
      totalUsers: users.length,
      totalOrders: orders.length,
      totalRevenue: revenue,
      activeOrders: active.length,
      hourlyVelocity,
      userTypeDist: [
        { name: 'Customer', value: users.filter(u => u.role === 'customer').length },
        { name: 'Vendor', value: users.filter(u => u.role === 'vendor').length },
        { name: 'Rider', value: users.filter(u => u.role === 'rider').length },
      ]
    };
  }

  // --- PRICE LISTS ---

  async getVendorPriceList(vendorUid: string): Promise<any[]> {
    await this.delay();
    const allLists = JSON.parse(localStorage.getItem('qw_vendor_price_lists') || '{}');
    // Case-insensitive lookup
    const key = Object.keys(allLists).find(k => k.toLowerCase() === vendorUid.toLowerCase());
    return key ? allLists[key] : [];
  }

  async saveVendorPriceList(vendorUid: string, priceList: any[]): Promise<void> {
    await this.delay();
    const allLists = JSON.parse(localStorage.getItem('qw_vendor_price_lists') || '{}');
    allLists[vendorUid] = priceList;
    localStorage.setItem('qw_vendor_price_lists', JSON.stringify(allLists));
    window.dispatchEvent(new Event('storage'));
  }

  // --- SITE SETTINGS ---
  async getSiteSettings(): Promise<SiteSettings> {
    await this.delay();
    const settings = localStorage.getItem('qw_site_settings');
    if (settings) return JSON.parse(settings);
    
    // Default settings
    const defaults: SiteSettings = {
      name: 'Quick-Wash',
      logo: '', // Base64 or URL
      primaryColor: '#1a56db',
      contactEmail: 'support@quickwash.app',
      contactPhone: '+234 812 345 6789',
      emergencyAlert: '',
      maintenanceMode: false,
      announcement: 'Welcome to the new Quick-Wash platform!'
    };
    localStorage.setItem('qw_site_settings', JSON.stringify(defaults));
    return defaults;
  }

  async updateSiteSettings(data: Partial<SiteSettings>): Promise<SiteSettings> {
    const current = await this.getSiteSettings();
    const updated = { ...current, ...data };
    localStorage.setItem('qw_site_settings', JSON.stringify(updated));
    window.dispatchEvent(new Event('storage'));
    return updated;
  }
}

export const db = new DatabaseService();
