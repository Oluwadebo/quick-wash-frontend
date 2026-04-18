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
  isRaining?: boolean;
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
  paymentMethod?: 'wallet' | 'transfer' | 'card';
  claimedAt?: string | null;
}

const API_URL = process.env.NEXT_PUBLIC_API_URL;

class DatabaseService {
  private async request(path: string, options: RequestInit = {}) {
    if (!API_URL) {
      console.error('API URL is not configured. Please set NEXT_PUBLIC_API_URL.');
      return null;
    }
    const token = typeof window !== 'undefined' ? localStorage.getItem('qw_token') : null;
    try {
      const response = await fetch(`${API_URL}${path}`, {
        ...options,
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
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
    return remote || [];
  }

  async getUser(uid: string): Promise<UserData | null> {
    const remote = await this.request(`/users/${uid}`);
    return remote || null;
  }

  async createUser(data: UserData): Promise<UserData> {
    const remote = await this.request('/users', {
      method: 'POST',
      body: JSON.stringify(data)
    });
    if (!remote) throw new Error('Failed to create user on backend');
    return remote;
  }

  async updateUser(uid: string, data: Partial<UserData>): Promise<UserData> {
    const remote = await this.request(`/users/${uid}`, {
      method: 'PATCH',
      body: JSON.stringify(data)
    });
    if (!remote) throw new Error('Failed to update user on backend');
    return remote;
  }

  async deleteUser(uid: string): Promise<void> {
    const remote = await this.request(`/users/${uid}`, { method: 'DELETE' });
    if (!remote && API_URL) console.warn('Failed to delete user on remote');
  }

  // --- ORDERS ---

  async getOrders(): Promise<Order[]> {
    const remote = await this.request('/orders');
    return remote || [];
  }

  async getOrder(id: string): Promise<Order | null> {
    const remote = await this.request(`/orders/${id}`);
    return remote || null;
  }

  async saveOrder(order: Order): Promise<Order> {
    const remote = await this.request('/orders', {
      method: 'POST',
      body: JSON.stringify(order)
    });
    if (!remote) throw new Error('Failed to save order on backend');
    return remote;
  }

  async claimOrder(orderId: string, riderUid: string, riderName: string, riderPhone: string): Promise<boolean> {
    const remote = await this.request(`/orders/${orderId}/claim`, {
      method: 'POST',
      body: JSON.stringify({ riderUid, riderName, riderPhone })
    });
    return remote === true || remote?.success === true;
  }

  async updateOrderStatus(orderId: string, status: string, color: string): Promise<Order> {
    const remote = await this.request(`/orders/${orderId}/status`, {
      method: 'PATCH',
      body: JSON.stringify({ status, color })
    });
    if (!remote) throw new Error('Failed to update order status on backend');
    return remote;
  }

  async runAutoCancel(): Promise<void> {
    await this.request('/orders/auto-cancel', { method: 'POST' });
  }

  async adjustTrustPoints(uid: string, action: TrustAction): Promise<UserData> {
    const remote = await this.request(`/users/${uid}/trust`, {
      method: 'POST',
      body: JSON.stringify({ action })
    });
    if (!remote) throw new Error('Failed to adjust trust points on backend');
    return remote;
  }

  async returnOrder(orderId: string, riderUid: string, reason: string): Promise<boolean> {
    const remote = await this.request(`/orders/${orderId}/return`, {
      method: 'POST',
      body: JSON.stringify({ riderUid, reason })
    });
    return remote === true || remote?.success === true;
  }

  async processAutoRecovery(uid: string): Promise<void> {
    await this.request(`/users/${uid}/auto-recovery`, { method: 'POST' });
  }

  async recordTransaction(uid: string, transaction: any) {
    await this.request(`/transactions/${uid}`, {
      method: 'POST',
      body: JSON.stringify(transaction)
    });
  }

  async disputeTransaction(uid: string, transactionId: string, reason: string): Promise<void> {
    await this.request(`/transactions/${uid}/dispute`, {
      method: 'POST',
      body: JSON.stringify({ transactionId, reason })
    });
  }

  async getVendorPriceList(vendorUid: string): Promise<any[]> {
    const remote = await this.request(`/vendors/${vendorUid}/price-list`);
    return remote || [];
  }

  async saveVendorPriceList(vendorUid: string, priceList: any[]): Promise<void> {
    await this.request(`/vendors/${vendorUid}/price-list`, {
      method: 'POST',
      body: JSON.stringify(priceList)
    });
  }

  async getWalletHistory(uid: string): Promise<any[]> {
    const remote = await this.request(`/transactions/${uid}`);
    return remote || [];
  }

  async getAuditLogs(): Promise<any[]> {
    const remote = await this.request('/admin/logs');
    return remote || [];
  }

  async addAuditLog(log: any): Promise<void> {
    await this.request('/admin/logs', {
      method: 'POST',
      body: JSON.stringify(log)
    });
  }

  async getCampaigns(): Promise<any[]> {
    const remote = await this.request('/admin/campaigns');
    return remote || [];
  }

  async saveCampaigns(campaigns: any[]): Promise<void> {
    await this.request('/admin/campaigns', {
      method: 'POST',
      body: JSON.stringify(campaigns)
    });
  }

  async getAlerts(): Promise<any[]> {
    const remote = await this.request('/admin/alerts');
    return remote || [];
  }

  async saveAlerts(alerts: any[]): Promise<void> {
    await this.request('/admin/alerts', {
      method: 'POST',
      body: JSON.stringify(alerts)
    });
  }

  async getGlobalServices(): Promise<string[]> {
    const remote = await this.request('/admin/global-services');
    return remote || ["Shirt", "Jeans", "Native", "Suit", "Duvet", "Bedsheet"];
  }

  async saveGlobalServices(services: string[]): Promise<void> {
    await this.request('/admin/global-services', {
      method: 'POST',
      body: JSON.stringify(services)
    });
  }
}

export const db = new DatabaseService();
