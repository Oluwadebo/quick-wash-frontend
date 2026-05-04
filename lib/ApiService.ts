/**
 * ApiService.ts
 * Thin client wrapper for the backend API.
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
  role: 'customer' | 'vendor' | 'rider' | 'admin' | 'super-admin' | 'super-sub-admin';
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
  currentOrderId?: string;
  alerts?: any[];
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

class ApiService {
  private async delay() {
    return new Promise(resolve => setTimeout(resolve, DELAY));
  }

  // --- USERS ---

  private async safeJson(resp: Response) {
    const contentType = resp.headers.get('content-type');
    if (contentType && contentType.includes('application/json')) {
      try {
        return await resp.json();
      } catch (e) {
        console.error('[ApiService] JSON parse error:', e);
        return null;
      }
    }
    const text = await resp.text();
    console.error('[ApiService] Expected JSON but got:', text.substring(0, 100));
    return null;
  }

  async getUsers(): Promise<UserData[]> {
    await this.delay();
    if (typeof window !== 'undefined') {
      try {
        const token = localStorage.getItem('qw_token');
        const resp = await fetch(`${API_URLS.base}/users`, {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        if (resp.ok) {
          return await this.safeJson(resp) || [];
        }
      } catch (e) {
        console.error('Failed to fetch users:', e);
      }
    }
    return [];
  }

  async getVendors(): Promise<Partial<UserData>[]> {
    await this.delay();
    try {
      const resp = await fetch(`${API_URLS.base}/vendors`);
      if (resp.ok) {
        return await this.safeJson(resp) || [];
      }
    } catch (e) {
      console.error('Failed to fetch vendors:', e);
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
          return await this.safeJson(resp);
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
          return await this.safeJson(resp);
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

  async getOrders(userId?: string, role?: string): Promise<Order[]> {
    await this.delay();
    const token = localStorage.getItem('qw_token');
    
    if (typeof window !== 'undefined' && token) {
      try {
        let url = `${API_URLS.orders}`; 
        if (userId && role) {
          url += `?userId=${userId}&role=${role}`;
        }
        
        const resp = await fetch(url, {
          headers: { 
            'Authorization': `Bearer ${token}`,
            'Accept': 'application/json',
            'Cache-Control': 'no-cache'
          }
        });
        
        if (resp.ok) return await this.safeJson(resp) || [];
        return [];
      } catch (e: any) {
        return []; 
      }
    }
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
        
        if (resp.ok) return await this.safeJson(resp);
        
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
        if (resp.ok) return await this.safeJson(resp);
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
        const resp = await fetch(`${API_URLS.orders}/${orderId}/claim`, {
          method: 'POST',
          headers: { 
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({ 
            riderUid, 
            riderName, 
            riderPhone
          })
        });
        return resp.ok;
      } catch (e) {
        return false;
      }
    }
    return false;
  }

  async cancelOrder(orderId: string, reason: string): Promise<any> {
    await this.delay();
    if (typeof window !== 'undefined') {
      try {
        const token = localStorage.getItem('qw_token');
        const resp = await fetch(`${API_URLS.orders}/${orderId}/cancel`, {
          method: 'POST',
          headers: { 
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({ reason })
        });
        if (resp.ok) return await this.safeJson(resp);
        throw new Error(await resp.text());
      } catch (e: any) {
        throw new Error(e.message);
      }
    }
    throw new Error('Action failed');
  }

  async updateOrderStatus(orderId: string, status: string, color: string, extraData: any = {}): Promise<Order> {
    await this.delay();
    if (typeof window !== 'undefined') {
      try {
        const token = localStorage.getItem('qw_token');
        const body = { 
          status, 
          color, 
          ...(typeof extraData === 'object' ? extraData : { handoverCode: extraData }) 
        };
        const resp = await fetch(`${API_URLS.orders}/${orderId}`, {
          method: 'PATCH',
          headers: { 
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(body)
        });
        if (resp.ok) return await this.safeJson(resp);
        throw new Error(await resp.text());
      } catch (e: any) {
        throw new Error(e.message);
      }
    }
    throw new Error('Action failed');
  }

  /**
   * Auto-cancel orders unassigned for > 30 mins (Backend controlled)
   */
  async runAutoCancel(): Promise<void> {
    if (typeof window !== 'undefined') {
      try {
        const token = localStorage.getItem('qw_token');
        if (!token) return; // Don't run if not logged in
        
        await fetch(`${API_URLS.orders}/auto-cancel`, {
          method: 'POST',
          headers: { 
            'Authorization': `Bearer ${token}`
          }
        });
      } catch (e) {
        // Silent for background task
      }
    }
  }

  async adjustTrustPoints(uid: string, action: TrustAction): Promise<UserData> {
    if (typeof window !== 'undefined') {
      const token = localStorage.getItem('qw_token');
      const resp = await fetch(`${API_URLS.base}/users/trust/adjust/${uid}`, {
        method: 'POST',
        headers: { 
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ action })
      });
      if (resp.ok) return await this.safeJson(resp);
    }
    throw new Error('Trust adjustment failed');
  }

  async returnOrder(orderId: string, riderUid: string, reason: string): Promise<boolean> {
    if (typeof window !== 'undefined') {
      const token = localStorage.getItem('qw_token');
      const resp = await fetch(`${API_URLS.orders}/${orderId}/return`, {
        method: 'POST',
        headers: { 
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ riderUid, reason })
      });
      return resp.ok;
    }
    return false;
  }

  /**
   * Auto-recovery: +10 points every 27 days of good behavior (no penalties)
   */
  async processAutoRecovery(uid: string): Promise<void> {
    if (typeof window !== 'undefined') {
      const token = localStorage.getItem('qw_token');
      await fetch(`${API_URLS.base}/users/trust/auto-recovery/${uid}`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` }
      });
    }
  }

  // --- WALLET ---
  async recordTransaction(userId: string, transaction: any) {
    if (typeof window !== 'undefined') {
      try {
        const token = localStorage.getItem('qw_token');
        await fetch(`${API_URLS.base}/transactions`, {
          method: 'POST',
          headers: { 
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({ ...transaction, userId })
        });
        window.dispatchEvent(new Event('storage'));
      } catch (e) {
        console.error('Transaction API error:', e);
      }
    }
  }

  async getUserTransactions(userId: string): Promise<any[]> {
    if (typeof window !== 'undefined') {
      try {
        const token = localStorage.getItem('qw_token');
        const resp = await fetch(`${API_URLS.base}/transactions?userId=${userId}`, {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        if (resp.ok) return await this.safeJson(resp) || [];
      } catch (e) {}
    }
    return [];
  }

  async getMe(): Promise<UserData | null> {
    if (typeof window !== 'undefined') {
      try {
        const token = localStorage.getItem('qw_token');
        if (!token) return null;
        const resp = await fetch(`${API_URLS.base}/users/me`, {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        if (resp.ok) return await this.safeJson(resp);
        
        if (resp.status === 401) {
          throw new Error('UNAUTHORIZED');
        }
        
        throw new Error(`SERVER_ERROR_${resp.status}`);
      } catch (e: any) {
        console.error('[ApiService] getMe error:', e.message || e);
        throw e;
      }
    }
    return null;
  }

  async approveUser(uid: string): Promise<UserData> {
    if (typeof window !== 'undefined') {
      const token = localStorage.getItem('qw_token');
      const resp = await fetch(`${API_URLS.base}/users/approve/${uid}`, {
        method: 'POST',
        headers: { 
          'Authorization': `Bearer ${token}`
        }
      });
      if (resp.ok) return await this.safeJson(resp);
    }
    throw new Error('Approval failed');
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
        if (resp.ok) return await this.safeJson(resp);
      } catch (e) {}
    }
    throw new Error('Rating failed');
  }

  // --- ANALYTICS ---
  async getSystemStats() {
    if (typeof window !== 'undefined') {
      try {
        const token = localStorage.getItem('qw_token');
        const resp = await fetch(API_URLS.stats, {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        if (resp.ok) return await this.safeJson(resp);
      } catch (e) {}
    }
    return null;
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
        if (resp.ok) return await this.safeJson(resp) || [];
      } catch (e) {}
    }
    return [];
  }

  async saveVendorPriceList(vendorUid: string, priceList: any[]): Promise<void> {
    await this.delay();
    if (typeof window !== 'undefined') {
      try {
        const token = localStorage.getItem('qw_token');
        const resp = await fetch(`${API_URLS.base}/vendor/prices/${vendorUid}`, {
          method: 'POST',
          headers: { 
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({ prices: priceList })
        });
        if (resp.ok) return await this.safeJson(resp);
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
        if (resp.ok) return await this.safeJson(resp);
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

  // --- DRAFTS ---
  async getDrafts(userId: string): Promise<any[]> {
    if (typeof window !== 'undefined') {
      try {
        const token = localStorage.getItem('qw_token');
        const resp = await fetch(`${API_URLS.base}/drafts/${userId}`, {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        if (resp.ok) return await this.safeJson(resp) || [];
      } catch (e) {}
    }
    return [];
  }

  async saveDraft(userId: string, vendorId: string, items: any[]): Promise<void> {
    if (typeof window !== 'undefined') {
      try {
        const token = localStorage.getItem('qw_token');
        const resp = await fetch(`${API_URLS.base}/drafts`, {
          method: 'POST',
          headers: { 
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json' 
          },
          body: JSON.stringify({ userId, vendorId, items })
        });
        if (resp.ok) return await this.safeJson(resp);
      } catch (e) {}
    }
  }

  async deleteDraft(userId: string, vendorId: string): Promise<void> {
    if (typeof window !== 'undefined') {
      try {
        const token = localStorage.getItem('qw_token');
        const resp = await fetch(`${API_URLS.base}/drafts/${userId}/${vendorId}`, {
          method: 'DELETE',
          headers: { 'Authorization': `Bearer ${token}` }
        });
        if (resp.ok) return await this.safeJson(resp);
      } catch (e) {}
    }
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
        if (resp.ok) return await this.safeJson(resp);
      } catch (e) {}
    }
    throw new Error('Settings update failed');
  }
}

export const api = new ApiService();
