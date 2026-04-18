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
  isLocked?: boolean;
  lockedBy?: string;
  lockExpires?: number;
  returnReason?: string;
  consecutiveReturns?: number;
}

const DELAY = 300; // Simulate network latency
const API_URL = process.env.NEXT_PUBLIC_API_URL;

class DatabaseService {
  private async delay() {
    return new Promise(resolve => setTimeout(resolve, DELAY));
  }

  private async request(path: string, options: RequestInit = {}) {
    if (!API_URL) return null;
    try {
      const response = await fetch(`${API_URL}${path}`, {
        ...options,
        headers: {
          'Content-Type': 'application/json',
          ...options.headers,
        },
      });
      if (!response.ok) return null;
      return await response.json();
    } catch (error) {
      console.error('API Request failed:', error);
      return null;
    }
  }

  // --- USERS ---

  async getUsers(): Promise<UserData[]> {
    const remote = await this.request('/users');
    if (remote) return remote;

    await this.delay();
    return JSON.parse(localStorage.getItem('qw_all_users') || '[]');
  }

  async getUser(uid: string): Promise<UserData | null> {
    const remote = await this.request(`/users/${uid}`);
    if (remote) return remote;

    const users = await this.getUsers();
    return users.find(u => u.uid === uid) || null;
  }

  async updateUser(uid: string, data: Partial<UserData>): Promise<UserData> {
    const remote = await this.request(`/users/${uid}`, {
      method: 'PATCH',
      body: JSON.stringify(data)
    });
    if (remote) return remote;

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
      user.status = 'suspended';
    } else if (user.trustPoints < 30) {
      user.status = 'suspended';
    } else if (user.trustPoints < 60) {
      user.status = 'restricted';
      if (!user.restrictionExpires) {
        user.restrictionExpires = new Date(Date.now() + 2 * 24 * 60 * 60 * 1000).toISOString();
      }
    } else {
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
    const currentUser = JSON.parse(localStorage.getItem('qw_user') || '{}');
    if (currentUser.uid === uid) {
      localStorage.setItem('qw_user', JSON.stringify(users[index]));
    }
    window.dispatchEvent(new Event('storage'));
    return users[index];
  }

  async deleteUser(uid: string): Promise<void> {
    const remote = await this.request(`/users/${uid}`, { method: 'DELETE' });
    if (remote) return;

    await this.delay();
    const users = await this.getUsers();
    const updated = users.filter(u => u.uid !== uid);
    localStorage.setItem('qw_all_users', JSON.stringify(updated));
    window.dispatchEvent(new Event('storage'));
  }

  // --- ORDERS ---

  async getOrders(): Promise<Order[]> {
    const remote = await this.request('/orders');
    if (remote) return remote;

    await this.delay();
    return JSON.parse(localStorage.getItem('qw_orders') || '[]');
  }

  async getOrder(id: string): Promise<Order | null> {
    const remote = await this.request(`/orders/${id}`);
    if (remote) return remote;

    const orders = await this.getOrders();
    return orders.find(o => o.id === id) || null;
  }

  async saveOrder(order: Order): Promise<Order> {
    const remote = await this.request('/orders', {
      method: 'POST',
      body: JSON.stringify(order)
    });
    if (remote) return remote;

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

  async claimOrder(orderId: string, riderUid: string, riderName: string, riderPhone: string): Promise<boolean> {
    const remote = await this.request(`/orders/${orderId}/claim`, {
      method: 'POST',
      body: JSON.stringify({ riderUid, riderName, riderPhone })
    });
    if (remote !== null) return remote; // Assuming remote returns true/false

    await this.delay();
    const orders = JSON.parse(localStorage.getItem('qw_orders') || '[]');
    const orderIndex = orders.findIndex((o: any) => o.id === orderId);
    if (orderIndex === -1) return false;
    const order = orders[orderIndex];
    const now = Date.now();
    if (order.riderUid) return false;
    if (order.isLocked && order.lockExpires && order.lockExpires > now) return false;
    order.isLocked = true;
    order.lockedBy = riderUid;
    order.lockExpires = now + 5000;
    localStorage.setItem('qw_orders', JSON.stringify(orders));
    await new Promise(resolve => setTimeout(resolve, 50));
    const recheckOrders = JSON.parse(localStorage.getItem('qw_orders') || '[]');
    const recheckOrder = recheckOrders.find((o: any) => o.id === orderId);
    if (recheckOrder.lockedBy !== riderUid) return false;
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

  async updateOrderStatus(orderId: string, status: string, color: string): Promise<Order> {
    const remote = await this.request(`/orders/${orderId}/status`, {
      method: 'PATCH',
      body: JSON.stringify({ status, color })
    });
    if (remote) return remote;

    const order = await this.getOrder(orderId);
    if (!order) throw new Error('Order not found');
    order.status = status;
    order.color = color;
    if (status === 'picked_up') order.pickedUpAt = new Date().toISOString();
    if (status === 'washing') order.washingAt = new Date().toISOString();
    if (status === 'ready') order.readyAt = new Date().toISOString();
    if (status === 'picked_up_delivery') order.pickedUpDeliveryAt = new Date().toISOString();
    if (status === 'delivered') order.deliveredAt = new Date().toISOString();
    if (status === 'completed') order.completedAt = new Date().toISOString();
    return await this.saveOrder(order);
  }

  async runAutoCancel(): Promise<void> {
    const remote = await this.request('/orders/auto-cancel', { method: 'POST' });
    if (remote) return;

    const orders = await this.getOrders();
    const now = new Date().getTime();
    const twentyMins = 20 * 60 * 1000;
    let changed = false;
    const updatedOrders = await Promise.all(orders.map(async (o) => {
      const isUnassigned = (o.status === 'rider_assign_pickup' || o.status === 'rider_assign_delivery') && !o.riderUid;
      if (isUnassigned && o.time) {
        const orderTime = new Date(o.time).getTime();
        if (now - orderTime > twentyMins && o.status !== 'cancelled') {
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
    const remote = await this.request(`/users/${uid}/trust`, {
      method: 'POST',
      body: JSON.stringify({ action })
    });
    if (remote) return remote;

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
        change = -25; isPenalty = true;
        const banExpiry = new Date(Date.now() + 2 * 24 * 60 * 60 * 1000).toISOString();
        return await this.updateUser(uid, { 
          trustPoints: user.trustPoints + change,
          status: 'restricted',
          restrictionExpires: banExpiry,
          lastPenaltyAt: new Date().toISOString()
        });
    }
    const update: Partial<UserData> = { trustPoints: user.trustPoints + change };
    if (isPenalty) update.lastPenaltyAt = new Date().toISOString();
    return await this.updateUser(uid, update);
  }

  async returnOrder(orderId: string, riderUid: string, reason: string): Promise<boolean> {
    const remote = await this.request(`/orders/${orderId}/return`, {
      method: 'POST',
      body: JSON.stringify({ riderUid, reason })
    });
    if (remote !== null) return remote;

    const order = await this.getOrder(orderId);
    const rider = await this.getUser(riderUid);
    if (!order || !rider || order.riderUid !== riderUid) return false;
    const penaltyFee = 200;
    const newBalance = Math.max(0, (rider.walletBalance || 0) - penaltyFee);
    const consecutiveReturns = (rider.consecutiveReturns || 0) + 1;
    let status = rider.status;
    let restrictionExpires = rider.restrictionExpires;
    if (consecutiveReturns >= 5) {
      status = 'suspended';
      restrictionExpires = new Date(Date.now() + 2 * 24 * 60 * 60 * 1000).toISOString();
    }
    await this.updateUser(riderUid, {
      walletBalance: newBalance,
      consecutiveReturns: consecutiveReturns >= 5 ? 0 : consecutiveReturns,
      status,
      restrictionExpires
    });
    await this.adjustTrustPoints(riderUid, 'rider_return_order');
    await this.recordTransaction(riderUid, {
      type: 'withdrawal',
      amount: penaltyFee,
      desc: `Order Return Penalty - Order #${orderId}`
    });
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

  async processAutoRecovery(uid: string): Promise<void> {
    const remote = await this.request(`/users/${uid}/auto-recovery`, { method: 'POST' });
    if (remote) return;

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

  async recordTransaction(uid: string, transaction: any) {
    const remote = await this.request(`/transactions/${uid}`, {
      method: 'POST',
      body: JSON.stringify(transaction)
    });
    if (remote) return;

    const history = JSON.parse(localStorage.getItem(`qw_wallet_history_${uid}`) || '[]');
    history.unshift({ ...transaction, id: Math.random().toString(36).substr(2, 9), date: new Date().toISOString() });
    localStorage.setItem(`qw_wallet_history_${uid}`, JSON.stringify(history));
  }

  async getVendorPriceList(vendorUid: string): Promise<any[]> {
    const remote = await this.request(`/vendors/${vendorUid}/price-list`);
    if (remote) return remote;

    await this.delay();
    const allLists = JSON.parse(localStorage.getItem('qw_vendor_price_lists') || '{}');
    const key = Object.keys(allLists).find(k => k.toLowerCase() === vendorUid.toLowerCase());
    return key ? allLists[key] : [];
  }

  async saveVendorPriceList(vendorUid: string, priceList: any[]): Promise<void> {
    const remote = await this.request(`/vendors/${vendorUid}/price-list`, {
      method: 'POST',
      body: JSON.stringify(priceList)
    });
    if (remote) return;

    await this.delay();
    const allLists = JSON.parse(localStorage.getItem('qw_vendor_price_lists') || '{}');
    allLists[vendorUid] = priceList;
    localStorage.setItem('qw_vendor_price_lists', JSON.stringify(allLists));
    window.dispatchEvent(new Event('storage'));
  }
}

export const db = new DatabaseService();
