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
  claimedAt?: string | null;
  paymentMethod?: 'wallet' | 'card' | 'transfer';
  penaltyApplied?: boolean;
  payoutReleased?: boolean;
  disputed?: boolean;
  issueDescription?: string | null;
  disputedAt?: string | null;
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

class DatabaseService {
  private async fetchAPI(endpoint: string, options: RequestInit = {}) {
    if (typeof window === 'undefined') return null;
    const token = localStorage.getItem('qw_token');
    const headers = {
      'Content-Type': 'application/json',
      ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
      ...(options.headers || {})
    };
    const response = await fetch(endpoint, { ...options, headers });
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'API request failed');
    }
    return response.json();
  }

  // --- USERS ---

  async getUsers(): Promise<UserData[]> {
    return this.fetchAPI('/api/admin/users');
  }

  async getUser(uid: string): Promise<UserData | null> {
    return this.fetchAPI(`/api/users/${uid}`);
  }

  async updateUser(uid: string, data: Partial<UserData>): Promise<UserData> {
    return this.fetchAPI(`/api/users/${uid}`, {
      method: 'PATCH',
      body: JSON.stringify(data)
    });
  }

  async deleteUser(uid: string): Promise<void> {
    await this.fetchAPI(`/api/admin/users/${uid}`, {
      method: 'DELETE'
    });
  }

  // --- ORDERS ---

  async getOrders(userId?: string, role?: string): Promise<Order[]> {
    let url = '/api/orders';
    if (userId && role) url += `?userId=${userId}&role=${role}`;
    return this.fetchAPI(url);
  }

  async getOrder(id: string): Promise<Order | null> {
    return this.fetchAPI(`/api/orders/${id}`);
  }

  async saveOrder(order: any): Promise<Order> {
    return this.fetchAPI('/api/orders', {
      method: 'POST',
      body: JSON.stringify(order)
    });
  }

  async claimOrder(orderId: string, riderUid: string, riderName: string, riderPhone: string): Promise<boolean> {
    const result = await this.fetchAPI(`/api/orders/${orderId}/claim`, {
      method: 'POST',
      body: JSON.stringify({ riderUid, riderName, riderPhone })
    });
    return result.success;
  }

  async updateOrderStatus(orderId: string, status: string, color: string, handoverCode?: string): Promise<Order> {
    return this.fetchAPI(`/api/orders/${orderId}/status`, {
      method: 'PATCH',
      body: JSON.stringify({ status, color, handoverCode })
    });
  }

  async submitDispute(orderId: string, data: any): Promise<Order> {
    return this.fetchAPI(`/api/orders/dispute`, {
      method: 'POST',
      body: JSON.stringify({ orderId, ...data })
    });
  }

  async resolveDispute(orderId: string, resolution: string, customAmount?: number): Promise<Order> {
    return this.fetchAPI(`/api/orders/${orderId}/status`, {
      method: 'PATCH',
      body: JSON.stringify({ action: 'resolve_dispute', resolution, customAmount })
    });
  }

  async returnOrder(orderId: string, riderUid: string, reason: string): Promise<boolean> {
    const result = await this.fetchAPI(`/api/orders/${orderId}/status`, {
      method: 'PATCH',
      body: JSON.stringify({ action: 'push_out', reason, riderUid })
    });
    return !!result;
  }
  async rateOrder(orderId: string, rating: number, review: string): Promise<Order> {
    return this.fetchAPI(`/api/orders/${orderId}/rate`, {
      method: 'POST',
      body: JSON.stringify({ rating, review })
    });
  }

  // --- ANALYTICS ---
  async getSystemStats() {
    return this.fetchAPI('/api/stats');
  }

  // --- PRICE LISTS ---

  async getVendorPriceList(vendorUid: string): Promise<any[]> {
    return this.fetchAPI(`/api/vendor/prices/${vendorUid}`);
  }

  async saveVendorPriceList(vendorUid: string, priceList: any[]): Promise<void> {
    await this.fetchAPI(`/api/vendor/prices/${vendorUid}`, {
      method: 'POST',
      body: JSON.stringify({ items: priceList })
    });
  }

  // --- SITE SETTINGS ---
  async getSiteSettings(): Promise<SiteSettings> {
    return this.fetchAPI('/api/settings');
  }

  async updateSiteSettings(data: Partial<SiteSettings>): Promise<SiteSettings> {
    return this.fetchAPI('/api/settings', {
      method: 'PATCH',
      body: JSON.stringify(data)
    });
  }

  // --- WALLET ---
  async getWalletHistory(uid: string) {
    return this.fetchAPI(`/api/wallet/history?uid=${uid}`);
  }

  async recordTransaction(uid: string, data: any) {
    return this.fetchAPI(`/api/wallet/transactions`, {
      method: 'POST',
      body: JSON.stringify({ uid, ...data })
    });
  }

  async processAutoRecovery(uid: string) {
    return this.fetchAPI(`/api/users/${uid}/recovery`, {
      method: 'POST'
    });
  }

  async adjustTrustPoints(uid: string, action: TrustAction) {
    return this.fetchAPI(`/api/users/${uid}/trust`, {
      method: 'POST',
      body: JSON.stringify({ action })
    });
  }

  async runAutoCancel() {
    return this.fetchAPI(`/api/orders/auto-cancel`, {
      method: 'POST'
    });
  }
}

export const db = new DatabaseService();
