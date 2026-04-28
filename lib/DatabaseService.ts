/**
 * DatabaseService.ts
 * Abstracts localStorage to simulate a real asynchronous database with atomic transactions.
 */

import { API_URLS } from './api-config';

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
  email: string;
  password?: string;
  role: 'customer' | 'vendor' | 'rider' | 'admin' | 'super-sub-admin';
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
  consecutiveReturns?: number;
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
  _id?: string;
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
  paymentMethod?: 'wallet' | 'transfer' | 'card';
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

export interface Landmark {
  id: string;
  name: string;
  active: boolean;
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
  globalServices: string[];
  landmarks: Landmark[];
}

const DELAY = 300; // Simulate network latency

class DatabaseService {
  private async delay() {
    return new Promise(resolve => setTimeout(resolve, DELAY));
  }

  // --- USERS ---

  async getUsers(): Promise<UserData[]> {
    await this.delay();
    if (typeof window !== 'undefined') {
      try {
        const token = localStorage.getItem('qw_token');
        const resp = await fetch(`${API_URLS.base}/users`, {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        if (resp.ok) {
          return await resp.json();
        }
      } catch (e) {
        console.error('Failed to fetch users:', e);
      }
    }
    return [];
  }

  async getUser(uid: string): Promise<UserData | null> {
    await this.delay();
    if (typeof window !== 'undefined') {
      try {
        const token = localStorage.getItem('qw_token');
        const resp = await fetch(`${API_URLS.base}/users/${uid}`, {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        if (resp.ok) {
          return await resp.json();
        }
      } catch (e) {
        console.error('Failed to fetch user:', e);
      }
    }
    return null;
  }

  async updateUser(uid: string, data: Partial<UserData>): Promise<UserData> {
    await this.delay();
    if (typeof window !== 'undefined') {
      try {
        const token = localStorage.getItem('qw_token');
        const resp = await fetch(`${API_URLS.base}/users/${uid}`, {
          method: 'PATCH',
          headers: { 
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(data)
        });
        if (resp.ok) {
          const updated = await resp.json();
          // If updating self, sync localStorage token-related info if needed, but usually we just re-fetch
          return updated;
        }
        throw new Error(await resp.text());
      } catch (e: any) {
        throw new Error(e.message);
      }
    }
    throw new Error('Client side only');
  }

  async deleteUser(uid: string): Promise<void> {
    await this.delay();
    if (typeof window !== 'undefined') {
      try {
        const token = localStorage.getItem('qw_token');
        await fetch(`${API_URLS.base}/users/${uid}`, {
          method: 'DELETE',
          headers: { 'Authorization': `Bearer ${token}` }
        });
      } catch (e) {}
    }
  }

  // --- ORDERS ---

  async deleteOrder(id: string): Promise<void> {
    try {
      console.log(`[DB] Deleting order: ${id}`);
      const resp = await fetch(`${API_URLS.base}/orders/${id}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${localStorage.getItem('qw_token')}` }
      });
      if (!resp.ok) {
        throw new Error(`Failed to delete order ${id}`);
      }
    } catch (error) {
      console.error(`[DB] Error deleting order ${id}:`, error);
      throw error;
    }
  }

  async getOrders(): Promise<Order[]> {
    await this.delay();
    const currentUser = JSON.parse(localStorage.getItem('qw_user') || '{}');
    const token = localStorage.getItem('qw_token');
    
    if (typeof window !== 'undefined' && currentUser.uid) {
      try {
        const url = `${API_URLS.orders}?userId=${currentUser.uid}&role=${currentUser.role}`;
        console.log(`[DB] Fetching orders for ${currentUser.uid} (${currentUser.role}) from: ${url}`);
        
        const resp = await fetch(url, {
          headers: { 
            'Authorization': `Bearer ${token}`,
            'Accept': 'application/json'
          }
        });
        
        if (resp.ok) {
          const data = await resp.json();
          console.log(`[DB] Successfully fetched ${data.length} orders`);
          return data;
        }
        
        const errorText = await resp.text();
        console.error(`[DB] Failed to fetch orders (Status: ${resp.status}): ${errorText}`);
        return []; // Return empty instead of throwing to prevent UI crash
      } catch (e: any) {
        console.error('[DB] Network Error during getOrders:', e.message || e);
        return []; // Resilient fallback
      }
    }
    console.warn('[DB] getOrders skipped: User UID or window undefined');
    return [];
  }

  async getOrder(id: string): Promise<Order | null> {
    await this.delay();
    if (typeof window !== 'undefined') {
      try {
        const token = localStorage.getItem('qw_token');
        const url = `${API_URLS.orders}/${id}`;
        console.log(`[DB] Fetching single order: ${url}`);
        
        const resp = await fetch(url, {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        
        if (resp.ok) return await resp.json();
        
        if (resp.status === 404) {
          console.warn(`[DB] Order not found: ${id}`);
          return null;
        }
        
        const errText = await resp.text();
        console.error(`[DB] Error fetching order ${id} (Status: ${resp.status}): ${errText}`);
      } catch (e: any) {
        console.error(`[DB] Network error fetching order ${id}:`, e.message || e);
      }
    }
    return null;
  }

  async saveOrder(order: any): Promise<any> {
    await this.delay();
    if (typeof window !== 'undefined') {
      try {
        const token = localStorage.getItem('qw_token');
        // A new order from the frontend will have a local 'id' but NO '_id' (MongoDB ID)
        const isNew = !order._id; 
        const resp = await fetch(isNew ? API_URLS.orders : `${API_URLS.orders}/${order.id || order._id}`, {
          method: isNew ? 'POST' : 'PATCH',
          headers: { 
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(order)
        });
        if (resp.ok) return await resp.json();
        throw new Error(await resp.text());
      } catch (e: any) {
        throw new Error(e.message);
      }
    }
    return order;
  }

  /**
   * Atomic Transaction: Claim Order
   */
  async claimOrder(orderId: string, riderUid: string, riderName: string, riderPhone: string): Promise<boolean> {
    await this.delay();
    if (typeof window !== 'undefined') {
      try {
        const token = localStorage.getItem('qw_token');
        const resp = await fetch(`${API_URLS.orders}/${orderId}`, {
          method: 'PATCH',
          headers: { 
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({ 
            riderUid, 
            riderName, 
            riderPhone,
            status: 'rider_accepted' // Update status when claimed
          })
        });
        return resp.ok;
      } catch (e) {
        return false;
      }
    }
    return false;
  }

  async updateOrderStatus(orderId: string, status: string, color: string, handoverCode?: string): Promise<Order> {
    await this.delay();
    if (typeof window !== 'undefined') {
      try {
        const token = localStorage.getItem('qw_token');
        const resp = await fetch(`${API_URLS.orders}/${orderId}`, {
          method: 'PATCH',
          headers: { 
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({ status, color, handoverCode })
        });
        if (resp.ok) return await resp.json();
        throw new Error(await resp.text());
      } catch (e: any) {
        throw new Error(e.message);
      }
    }
    throw new Error('Client mode enabled');
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

    // 3. Check for 3 consecutive returns -> 2 day suspension
    if (consecutiveReturns >= 3) {
      status = 'suspended';
      restrictionExpires = new Date(Date.now() + 2 * 24 * 60 * 60 * 1000).toISOString();
    }

    await this.updateUser(riderUid, {
      walletBalance: newBalance,
      consecutiveReturns: consecutiveReturns >= 3 ? 0 : consecutiveReturns, // Reset if suspended
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
    if (typeof window !== 'undefined') {
      try {
        const token = localStorage.getItem('qw_token');
        const resp = await fetch(`${API_URLS.base}/transactions`, {
          method: 'POST',
          headers: { 
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({ ...transaction, userId: uid })
        });
        if (resp.ok) {
          const result = await resp.json();
          const storedUser = localStorage.getItem('qw_user');
          if (storedUser) {
            const user = JSON.parse(storedUser);
            if (user.uid === uid) {
              user.walletBalance = result.balance;
              localStorage.setItem('qw_user', JSON.stringify(user));
            }
          }
        } else {
          console.error('Transaction failed:', await resp.text());
        }
      } catch (e) {
        console.error('Transaction API error:', e);
      }
    }
  }

  // --- RATINGS ---
  async rateOrder(orderId: string, rating: number, review: string): Promise<Order> {
    await this.delay();
    if (typeof window !== 'undefined') {
      try {
        const token = localStorage.getItem('qw_token');
        const resp = await fetch(`${API_URLS.orders}/${orderId}`, {
          method: 'PATCH',
          headers: { 
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({ rating, review, ratedAt: new Date().toISOString() })
        });
        if (resp.ok) return await resp.json();
      } catch (e) {}
    }
    throw new Error('Rating failed');
  }

  // --- ANALYTICS ---
  async getSystemStats() {
    const users = await this.getUsers();
    const orders = await this.getOrders();
    const now = new Date();

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
    if (typeof window !== 'undefined') {
      try {
        const token = localStorage.getItem('qw_token');
        const resp = await fetch(`${API_URLS.base}/vendor/prices/${vendorUid}`, {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        if (resp.ok) return await resp.json();
      } catch (e) {}
    }
    return [];
  }

  async saveVendorPriceList(vendorUid: string, priceList: any[]): Promise<void> {
    await this.delay();
    if (typeof window !== 'undefined') {
      try {
        const token = localStorage.getItem('qw_token');
        await fetch(`${API_URLS.base}/vendor/prices/${vendorUid}`, {
          method: 'POST',
          headers: { 
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({ prices: priceList })
        });
      } catch (e) {}
    }
  }

  // --- SITE SETTINGS ---
  async getSiteSettings(): Promise<SiteSettings> {
    await this.delay();
    if (typeof window !== 'undefined') {
      try {
        const token = localStorage.getItem('qw_token');
        const resp = await fetch(`${API_URLS.base}/settings`, {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        if (resp.ok) return await resp.json();
      } catch (e) {}
    }
    
    // Default settings
    const defaults: SiteSettings = {
      name: 'Quick-Wash',
      logo: '', // Base64 or URL
      primaryColor: '#1a56db',
      contactEmail: 'support@quickwash.app',
      contactPhone: '+234 812 345 6789',
      emergencyAlert: '',
      maintenanceMode: false,
      announcement: 'Welcome to the new Quick-Wash platform!',
      globalServices: ["Shirt", "Jeans", "Native", "Suit", "Duvet", "Bedsheet"],
      landmarks: []
    };
    return defaults;
  }

  async updateSiteSettings(data: Partial<SiteSettings>): Promise<SiteSettings> {
    await this.delay();
    if (typeof window !== 'undefined') {
      try {
        const token = localStorage.getItem('qw_token');
        const resp = await fetch(`${API_URLS.base}/settings`, {
          method: 'PATCH',
          headers: { 
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(data)
        });
        if (resp.ok) return await resp.json();
      } catch (e) {}
    }
    throw new Error('Settings update failed');
  }
}

export const db = new DatabaseService();
