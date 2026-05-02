'use client';

import React from 'react';
import TopAppBar from '@/components/shared/TopAppBar';
import { 
  Users, ShoppingBag, TrendingUp, AlertTriangle, ShieldCheck, 
  Map, Activity, ArrowUpRight, Check, X as XIcon, 
  Wallet, BarChart3, Megaphone, History, MessageSquare, 
  Search, Filter, MoreHorizontal, UserPlus, Trash2, ExternalLink,
  Edit3, Bike, Package, Navigation, Info, Plus, MapPin, X, Globe, Star,
  Zap, CheckCircle, ShieldAlert
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { cn } from '@/lib/utils';
import { useAuth } from '@/hooks/use-auth';
import ProtectedRoute from '@/components/shared/ProtectedRoute';
import Image from 'next/image';
import { useSearchParams } from 'next/navigation';
import { api, SiteSettings } from '@/lib/ApiService';
import { API_URLS } from '@/lib/api-config';

import { 
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  AreaChart, Area, BarChart, Bar, PieChart, Pie, Cell
} from 'recharts';

type AdminTab = 'overview' | 'orders' | 'disputes' | 'users' | 'wallets' | 'analytics' | 'marketing' | 'audit' | 'settings';
type UserSection = 'all' | 'admin' | 'vendor' | 'rider' | 'customer' | 'marketing';

export default function AdminDashboard() {
  const searchParams = useSearchParams();
  const tabParam = searchParams.get('tab') as AdminTab;
  const { approveUser, user: currentUser } = useAuth();
  const [activeTab, setActiveTab] = React.useState<AdminTab>('overview');

  React.useEffect(() => {
    setActiveTab(tabParam || 'overview');
  }, [tabParam]);
  const [userSection, setUserSection] = React.useState<UserSection>('all');
  const [pendingUsers, setPendingUsers] = React.useState<any[]>([]);
  const [allUsers, setAllUsers] = React.useState<any[]>([]);
  const [allTransactions, setAllTransactions] = React.useState<any[]>([]);
  const [orders, setOrders] = React.useState<any[]>([]);
  const [alerts, setAlerts] = React.useState<any[]>([]);
  const [stats, setStats] = React.useState<any[]>([]);

  const [isUserModalOpen, setIsUserModalOpen] = React.useState(false);
  const [isAddUserModalOpen, setIsAddUserModalOpen] = React.useState(false);
  const [historyModal, setHistoryModal] = React.useState<{ open: boolean; type: 'payout' | 'withdrawal' }>({ open: false, type: 'payout' });
  const [editingUser, setEditingUser] = React.useState<any>(null);
  const [newUser, setNewUser] = React.useState<any>({
    fullName: '',
    phoneNumber: '',
    email: '',
    password: '',
    role: 'customer',
    status: 'active',
    isApproved: true
  });

  const isSuperAdmin = currentUser?.role === 'super-admin' || currentUser?.email === 'ogunweoluwadebo1@gmail.com' || currentUser?.email === 'ogunwedebo21@gmail.com' || currentUser?.phoneNumber === '07048865686';
  const isSuperSubAdmin = currentUser?.role === 'super-sub-admin';
  const hasFullAdminPrivileges = isSuperAdmin || isSuperSubAdmin || currentUser?.role === 'admin';

  const handleRestrictUser = async (uid: string, status: 'active' | 'restricted' | 'suspended') => {
    if (!hasFullAdminPrivileges) {
      alert('Only Super Admin can restrict or ban users.');
      return;
    }
    try {
      const token = localStorage.getItem('qw_token');
      const resp = await fetch(`/api/users/${uid}`, {
        method: 'PATCH',
        headers: { 
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ status })
      });
      if (resp.ok) {
        setAllUsers(prev => prev.map(u => u.uid === uid ? { ...u, status } : u));
        alert(`User status updated to ${status}.`);
      }
    } catch (err) {
      alert('Failed to update status.');
    }
  };

  const [inviteLink, setInviteLink] = React.useState<string | null>(null);

  const handleAddUser = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const token = localStorage.getItem('qw_token');
      
      // If role is admin, use the invite system
      if (newUser.role === 'admin' || newUser.role === 'super-sub-admin') {
        const resp = await fetch(`${API_URLS.base}/admin/invite`, {
          method: 'POST',
          headers: { 
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({ 
            fullName: newUser.fullName, 
            email: newUser.email,
            role: newUser.role 
          })
        });
        
        if (resp.ok) {
          const data = await resp.json();
          let finalLink = data.inviteLink;
          // If the link is localhost but we are not on localhost, use current origin
          if (finalLink && typeof window !== 'undefined' && finalLink.includes('localhost') && !window.location.hostname.includes('localhost')) {
            finalLink = finalLink.replace(/^https?:\/\/[^\/]+/, window.location.origin);
          }
          setInviteLink(finalLink);
          setNotification({ message: 'Invite link generated successfully!', type: 'success' });
          return;
        } else {
          const err = await resp.json();
          setNotification({ message: err.message || 'Failed to generate invite link.', type: 'error' });
          return;
        }
      }

      const resp = await fetch(`${API_URLS.base}/admin/users/create`, {
        method: 'POST',
        headers: { 
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ ...newUser, trustPoints: 50, trustScore: 100, walletBalance: 0, pendingBalance: 0 })
      });
      
      if (resp.ok) {
        const createdUser = await resp.json();
        setAllUsers(prev => [...prev, createdUser]);
        setIsAddUserModalOpen(false);
        setNewUser({ fullName: '', phoneNumber: '', email: '', password: '', role: 'customer', status: 'active', isApproved: true });
        setNotification({ message: `User ${newUser.fullName} created successfully!`, type: 'success' });
      } else {
        const err = await resp.json();
        setNotification({ message: err.message || 'Failed to create user.', type: 'error' });
      }
    } catch (err) {
      setNotification({ message: 'Network error occurred.', type: 'error' });
    }
  };
  const [isVerificationModalOpen, setIsVerificationModalOpen] = React.useState(false);
  const [verifyingUser, setVerifyingUser] = React.useState<any>(null);
  const [siteSettings, setSiteSettings] = React.useState<SiteSettings | null>(null);
  const [isSiteUpdating, setIsSiteUpdating] = React.useState(false);
  const [systemStats, setSystemStats] = React.useState<any>(null);
  const [landmarks, setLandmarks] = React.useState<any[]>([]);
  const [riders, setRiders] = React.useState<any[]>([]);
  const [isLandmarkModalOpen, setIsLandmarkModalOpen] = React.useState(false);
  const [newLandmarkName, setNewLandmarkName] = React.useState('');
  const [notification, setNotification] = React.useState<{ message: string, type: 'success' | 'error' | 'info' } | null>(null);

  React.useEffect(() => {
    const fetchData = async () => {
      try {
        const token = localStorage.getItem('qw_token');
        const [usersRes, ordersRes, transRes, campRes, auditRes, sysStats, site] = await Promise.all([
          fetch(`${API_URLS.base}/admin/users`, { headers: { 'Authorization': `Bearer ${token}` } }),
          fetch(`${API_URLS.base}/orders`, { headers: { 'Authorization': `Bearer ${token}` } }),
          fetch(`${API_URLS.base}/transactions`, { headers: { 'Authorization': `Bearer ${token}` } }),
          fetch(`${API_URLS.base}/campaigns`, { headers: { 'Authorization': `Bearer ${token}` } }),
          fetch(`${API_URLS.base}/audit-logs`, { headers: { 'Authorization': `Bearer ${token}` } }),
          api.getSystemStats(),
          api.getSiteSettings()
        ]);

        const [usersData, ordersData, transData, campData, auditData] = await Promise.all([
          usersRes.ok ? usersRes.json() : Promise.resolve([]),
          ordersRes.ok ? ordersRes.json() : Promise.resolve([]),
          transRes.ok ? transRes.json() : Promise.resolve([]),
          campRes.ok ? campRes.json() : Promise.resolve([]),
          auditRes.ok ? auditRes.json() : Promise.resolve([])
        ]);

        setAllUsers(usersData);
        setOrders(ordersData);
        setAllTransactions(transData);
        setCampaigns(campData);
        setAuditLogs(auditData);
        setSystemStats(sysStats);
        setSiteSettings(site);

        setPendingUsers(usersData.filter((u: any) => !u.isApproved));
        setRiders(usersData.filter((u: any) => u.role === 'rider' && u.isApproved));

        const totalRevenue = ordersData.reduce((acc: number, o: any) => acc + (Number(o.totalPrice) || 0), 0);
        const activeOrders = ordersData.filter((o: any) => o.status !== 'delivered' && o.status !== 'completed' && !o.status.includes('Cancelled')).length;
        
        setStats([
          { label: 'Total Revenue', value: `₦${(totalRevenue || 0).toLocaleString()}`, trend: '+18.2%', icon: TrendingUp, color: 'text-primary' },
          { label: 'Active Orders', value: activeOrders.toString(), trend: '+5.4%', icon: ShoppingBag, color: 'text-tertiary' },
          { label: 'Total Users', value: usersData.length.toString(), trend: '+12.1%', icon: Users, color: 'text-on-surface' },
          { label: 'System Health', value: '99.9%', trend: 'Stable', icon: Activity, color: 'text-primary' }
        ]);
      } catch (err) {
        console.error('Fetch error:', err);
      }
    };
    fetchData();
    window.addEventListener('storage', fetchData);
    return () => window.removeEventListener('storage', fetchData);
  }, [currentUser]);
  const [selectedDetail, setSelectedDetail] = React.useState<any>(null);
  const [isDetailModalOpen, setIsDetailModalOpen] = React.useState(false);
  const [showNewUserPassword, setShowNewUserPassword] = React.useState(false);
  const [broadcastMessage, setBroadcastMessage] = React.useState('');
  const [broadcastAudience, setBroadcastAudience] = React.useState('All Users');
  const [isOverriding, setIsOverriding] = React.useState(false);
  const [overrideData, setOverrideData] = React.useState({ action: '', reason: '' });

  const [campaigns, setCampaigns] = React.useState<any[]>([]);
  const [isCampaignModalOpen, setIsCampaignModalOpen] = React.useState(false);
  const [editingCampaign, setEditingCampaign] = React.useState<any>(null);
  const [campaignToDelete, setCampaignToDelete] = React.useState<number | null>(null);
  const [campaignForm, setCampaignForm] = React.useState({
    name: '',
    status: 'Active',
    reach: '0',
    conversion: '0%',
    color: 'bg-primary'
  });

  const [auditLogs, setAuditLogs] = React.useState<any[]>([]);
  const handleAddCampaign = async (e: React.FormEvent) => {
    e.preventDefault();
    const token = localStorage.getItem('qw_token');
    
    try {
      let resp;
      if (editingCampaign) {
        resp = await fetch(`/api/campaigns/${editingCampaign.id}`, {
          method: 'PATCH',
          headers: { 
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json' 
          },
          body: JSON.stringify(campaignForm)
        });
      } else {
        resp = await fetch(`${API_URLS.base}/campaigns`, {
          method: 'POST',
          headers: { 
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json' 
          },
          body: JSON.stringify(campaignForm)
        });
      }

      if (resp.ok) {
        const saved = await resp.json();
        setCampaigns(prev => editingCampaign ? prev.map(c => c.id === editingCampaign.id ? saved : c) : [...prev, saved]);
        setIsCampaignModalOpen(false);
        setEditingCampaign(null);
        setCampaignForm({ name: '', status: 'Active', reach: '0', conversion: '0%', color: 'bg-primary' });
        
        // Record Audit Log
        await fetch(`${API_URLS.base}/audit-logs`, {
          method: 'POST',
          headers: { 
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json' 
          },
          body: JSON.stringify({
            action: editingCampaign ? 'Campaign Updated' : 'Campaign Created',
            target: campaignForm.name,
            admin: currentUser?.phoneNumber,
            details: `Admin ${currentUser?.fullName} ${editingCampaign ? 'updated' : 'created'} campaign: ${campaignForm.name}`
          })
        });
      }
    } catch (err) {}
  };

  const handleDeleteCampaign = async (id: number) => {
    const token = localStorage.getItem('qw_token');
    try {
      const resp = await fetch(`/api/campaigns/${id}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (resp.ok) {
        setCampaigns(prev => prev.filter(c => c.id !== id));
        // Record Audit Log
        await fetch(`${API_URLS.base}/audit-logs`, {
          method: 'POST',
          headers: { 
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json' 
          },
          body: JSON.stringify({
            action: 'Campaign Deleted',
            target: id.toString(),
            admin: currentUser?.phoneNumber,
            details: `Admin ${currentUser?.fullName} deleted campaign ID: ${id}`
          })
        });
      }
    } catch (err) {}
    setCampaignToDelete(null);
  };

  const clearAlerts = () => {
    setNotification({ message: 'System alerts are managed by hardware nodes.', type: 'info' });
    setTimeout(() => setNotification(null), 3000);
  };

  const handleEditUser = (user: any) => {
    setEditingUser(user);
    setIsUserModalOpen(true);
  };

  const handleDeleteUser = async (uid: string) => {
    if (!hasFullAdminPrivileges) {
      alert('Only Super Admin can delete users.');
      return;
    }

    if (confirm('Are you sure you want to delete this user?')) {
      await api.deleteUser(uid);
      const updated = await api.getUsers();
      setAllUsers(updated);
      setPendingUsers(updated.filter((u: any) => !u.isApproved));

      // Audit Log
      const token = localStorage.getItem('qw_token');
      await fetch(`${API_URLS.base}/audit-logs`, {
        method: 'POST',
        headers: { 
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json' 
        },
        body: JSON.stringify({
          action: 'User Deleted',
          target: uid,
          admin: currentUser?.phoneNumber,
          details: `Super Admin ${currentUser?.fullName} deleted user with UID: ${uid}`
        })
      });
      
      alert('User deleted successfully.');
    }
  };

  const handleSaveUser = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const updated = await api.updateUser(editingUser.uid, editingUser);
      setAllUsers(prev => prev.map(u => u.uid === updated.uid ? updated : u));
      setIsUserModalOpen(false);
      alert('User updated successfully!');
    } catch (err: any) {
      alert(err.message || 'Failed to update user.');
    }
  };

  const assignRider = async (orderId: string, riderPhone: string) => {
    try {
      const token = localStorage.getItem('qw_token');
      const resp = await fetch(`/api/orders/${orderId}`, {
        method: 'PATCH',
        headers: { 
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json' 
        },
        body: JSON.stringify({ riderPhone })
      });
      if (resp.ok) {
        const updated = await resp.json();
        setOrders(prev => prev.map(o => o.id === orderId ? updated : o));
        alert('Rider assigned successfully!');
      }
    } catch (err) {}
  };

  const [isRefundModalOpen, setIsRefundModalOpen] = React.useState(false);
  const [resolvingOrder, setResolvingOrder] = React.useState<any>(null);
  const [refundAmount, setRefundAmount] = React.useState<number>(0);

  const handleResolveDispute = async (orderId: string, resolution: 'refund' | 'reject' | 'partial', customAmount?: number) => {
    try {
      const response = await fetch(`${API_URLS.base}/orders/dispute`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('qw_token')}`
        },
        body: JSON.stringify({ orderId, resolution, customAmount })
      });

      if (response.ok) {
        const updatedOrder = await response.json();
        setOrders(prev => prev.map(o => o.id === orderId ? updatedOrder : o));
        setIsRefundModalOpen(false);
        setResolvingOrder(null);
        alert(`Dispute ${resolution}ed successfully.`);
      } else {
        const error = await response.json();
        alert(error.message || 'Failed to resolve dispute');
      }
    } catch (error) {
      console.error('Dispute resolution error:', error);
      alert('An error occurred. Please try again.');
    }
  };

  const handleApprove = React.useCallback(async (userId: string) => {
    try {
      const response = await fetch(`/api/users/approve/${userId}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('qw_token')}`
        }
      });

      if (response.ok) {
        const updatedUser = await response.json();
        setAllUsers(prev => prev.map(u => u.uid === userId ? updatedUser : u));
        setPendingUsers(prev => prev.filter(u => u.uid !== userId));
        alert('User approved successfully!');
      } else {
        const error = await response.json();
        alert(error.message || 'Failed to approve user');
      }
    } catch (error) {
      console.error('Approval error:', error);
      alert('An error occurred. Please try again.');
    }
  }, []);

  const tabs: { id: AdminTab; label: string; icon: any }[] = [
    { id: 'overview', label: 'Overview', icon: Activity },
    { id: 'orders', label: 'Orders', icon: ShoppingBag },
    { id: 'disputes', label: 'Disputes', icon: AlertTriangle },
    { id: 'users', label: 'Users', icon: Users },
    { id: 'wallets', label: 'Wallets', icon: Wallet },
    { id: 'analytics', label: 'Analytics', icon: BarChart3 },
    { id: 'marketing', label: 'Marketing', icon: Megaphone },
    { id: 'audit', label: 'Audit Log', icon: History },
    { id: 'settings', label: 'Settings', icon: Map },
  ];

  return (
    <div className="pb-32 bg-surface">
      <TopAppBar roleLabel={isSuperAdmin ? 'Super Admin' : 'Moderator Admin'} />
      
      <div className="flex-1 overflow-y-auto p-8">
        <header className="mb-10 flex justify-between items-end">
              <div>
                <h1 className="text-4xl font-headline font-black text-on-surface tracking-tighter capitalize">
                  {activeTab}
                </h1>
                <p className="text-on-surface-variant font-medium">Manage your campus laundry ecosystem.</p>
              </div>
              <div className="flex gap-3">
                <div className="relative">
                  <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-on-surface-variant w-4 h-4" />
                  <input 
                    type="text" 
                    placeholder="Search anything..."
                    className="h-12 pl-10 pr-6 bg-surface-container-low rounded-xl border border-primary/5 outline-none focus:border-primary transition-all text-sm font-medium"
                  />
                </div>
                <button className="w-12 h-12 bg-surface-container-low rounded-xl flex items-center justify-center text-on-surface-variant border border-primary/5">
                  <Filter className="w-5 h-5" />
                </button>
              </div>
            </header>

            <AnimatePresence mode="wait">
              {activeTab === 'overview' && (
                <motion.div 
                  key="overview"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  className="space-y-10"
                >
                  {/* Stats Grid */}
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                    {stats.map((stat, idx) => (
                      <div key={stat.label} className="bg-surface-container-low p-6 rounded-[2rem] border border-primary/5 shadow-sm">
                        <div className="flex justify-between items-start mb-4">
                          <div className={cn("p-3 rounded-2xl bg-surface-container-lowest shadow-sm", stat.color)}>
                            <stat.icon className="w-6 h-6" />
                          </div>
                          <span className="font-label text-[10px] font-black uppercase tracking-widest text-primary bg-primary/5 px-2 py-1 rounded-md">{stat.trend}</span>
                        </div>
                        <p className="font-label text-xs font-bold text-on-surface-variant uppercase tracking-widest mb-1">{stat.label}</p>
                        <h3 className="text-2xl font-headline font-black text-on-surface">{stat.value}</h3>
                      </div>
                    ))}
                  </div>

                  {/* Pending Approvals */}
                  {pendingUsers.length > 0 && (
                    <section>
                      <h2 className="text-2xl font-headline font-black text-on-surface mb-6">Pending Approvals</h2>
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {pendingUsers.map((u) => (
                          <div key={u.phoneNumber} className="bg-surface-container-low p-6 rounded-[2rem] border border-primary/10 shadow-sm">
                            <div className="flex justify-between items-start mb-4">
                              <div className="flex items-center gap-3">
                                <div className="w-12 h-12 rounded-2xl bg-primary/10 flex items-center justify-center text-primary">
                                  <Users className="w-6 h-6" />
                                </div>
                                <div>
                                  <h4 className="font-headline font-black text-on-surface">{u.fullName}</h4>
                                  <p className="font-label text-[10px] font-black uppercase tracking-widest text-primary">{u.role}</p>
                                </div>
                              </div>
                            </div>
                            <div className="space-y-2 mb-6">
                              <p className="text-xs font-medium text-on-surface-variant">Phone: {u.phoneNumber}</p>
                              {u.shopName && <p className="text-xs font-medium text-on-surface-variant">Shop: {u.shopName}</p>}
                            </div>
                            <div className="flex gap-3">
                              <button 
                                onClick={() => {
                                  setVerifyingUser(u);
                                  setIsVerificationModalOpen(true);
                                }}
                                className="flex-1 h-12 bg-surface-container-highest text-on-surface rounded-xl font-headline font-bold text-xs flex items-center justify-center active:scale-95 transition-transform"
                              >
                                View Details
                              </button>
                              <button 
                                onClick={() => handleApprove(u.uid)}
                                className="w-12 h-12 bg-primary text-on-primary rounded-xl flex items-center justify-center active:scale-95 transition-transform"
                              >
                                <Check className="w-4 h-4" />
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    </section>
                  )}

                  <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    <div className="lg:col-span-2 bg-surface-container-low rounded-[2.5rem] p-8 border border-primary/5">
                      <h2 className="text-2xl font-headline font-black text-on-surface mb-6">Live Activity Map</h2>
                      <div className="bg-surface-container-lowest aspect-video rounded-[2rem] relative overflow-hidden">
                        <Image src="https://picsum.photos/seed/map/1200/800" alt="Map" fill className="object-cover opacity-20 grayscale" />
                        
                        {/* Simulated Map Markers */}
                        <div className="absolute inset-0">
                          {[
                            { top: '20%', left: '30%', color: 'bg-primary' },
                            { top: '45%', left: '60%', color: 'bg-tertiary' },
                            { top: '70%', left: '40%', color: 'bg-primary' },
                            { top: '30%', left: '80%', color: 'bg-secondary' },
                            { top: '60%', left: '20%', color: 'bg-primary' },
                          ].map((marker, i) => (
                            <motion.div
                              key={i}
                              initial={{ scale: 0 }}
                              animate={{ scale: [1, 1.2, 1] }}
                              transition={{ repeat: Infinity, duration: 2, delay: i * 0.4 }}
                              className={cn("absolute w-4 h-4 rounded-full shadow-lg border-2 border-white", marker.color)}
                              style={{ top: marker.top, left: marker.left }}
                            >
                              <div className={cn("absolute inset-0 rounded-full animate-ping opacity-50", marker.color)}></div>
                            </motion.div>
                          ))}
                        </div>

                        <div className="absolute bottom-6 left-6 right-6 flex justify-between items-end">
                          <div className="bg-surface/90 backdrop-blur-md p-4 rounded-2xl border border-primary/10 shadow-xl">
                            <p className="text-[10px] font-black uppercase tracking-widest text-primary mb-1">Active Now</p>
                            <div className="flex items-center gap-4">
                              <div>
                                <p className="text-xl font-headline font-black text-on-surface">12</p>
                                <p className="text-[8px] font-bold text-on-surface-variant uppercase">Riders</p>
                              </div>
                              <div className="w-px h-8 bg-primary/10"></div>
                              <div>
                                <p className="text-xl font-headline font-black text-on-surface">45</p>
                                <p className="text-[8px] font-bold text-on-surface-variant uppercase">Orders</p>
                              </div>
                            </div>
                          </div>
                          <div className="flex gap-2">
                            <div className="w-10 h-10 bg-surface/90 backdrop-blur-md rounded-xl flex items-center justify-center border border-primary/10 shadow-lg">
                              <Navigation className="w-5 h-5 text-primary" />
                            </div>
                            <div className="w-10 h-10 bg-surface/90 backdrop-blur-md rounded-xl flex items-center justify-center border border-primary/10 shadow-lg">
                              <Map className="w-5 h-5 text-on-surface-variant" />
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                    
                    <div className="bg-surface-container-low rounded-[2.5rem] p-8 border border-primary/5">
                      <div className="flex justify-between items-center mb-6">
                        <h2 className="text-2xl font-headline font-black text-on-surface">Live Network Pulse</h2>
                        <div className="flex items-center gap-2">
                          <span className="w-2 h-2 bg-success rounded-full animate-pulse" />
                          <span className="text-[10px] font-black text-success uppercase tracking-widest">Connected</span>
                        </div>
                      </div>
                      <div className="bg-surface-container-lowest rounded-2xl p-4 font-mono text-[10px] space-y-2 max-h-[300px] overflow-y-auto custom-scrollbar">
                        <p className="text-success">[OK] System ready. Listening for orders...</p>
                        <p className="text-on-surface-variant">[{new Date().toLocaleTimeString()}] WebSocket connected to campus nodes.</p>
                        <p className="text-primary">[{new Date().toLocaleTimeString()}] API Request: GET /api/stats (200ms)</p>
                        <p className="text-tertiary">[{new Date().toLocaleTimeString()}] Trust Engine: Processed 12 point adjustments.</p>
                        {orders.slice(0, 5).map(o => (
                          <p key={o.id} className="text-on-surface-variant">[{new Date(o.createdAt).toLocaleTimeString()}] NEW ORDER: #{o.id} from {o.customerLandmark}</p>
                        ))}
                        <p className="text-on-surface-variant opacity-50 underline cursor-default italic">End of recent logs.</p>
                      </div>
                    </div>
                  </div>
                </motion.div>
              )}

              {activeTab === 'analytics' && (
                <motion.div 
                  key="analytics"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="space-y-10"
                >
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                    <div className="bg-surface-container-low rounded-[2.5rem] p-8 border border-primary/5">
                      <h3 className="text-xl font-headline font-black mb-6">Order Velocity (12h)</h3>
                      <div className="h-[300px]">
                        <ResponsiveContainer width="100%" height="100%">
                          <AreaChart data={systemStats?.hourlyVelocity || []}>
                            <defs>
                              <linearGradient id="colorOrders" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="5%" stopColor="#1a56db" stopOpacity={0.3}/>
                                <stop offset="95%" stopColor="#1a56db" stopOpacity={0}/>
                              </linearGradient>
                            </defs>
                            <CartesianGrid strokeDasharray="3 3" vertical={false} strokeOpacity={0.1} />
                            <XAxis dataKey="time" axisLine={false} tickLine={false} tick={{ fontSize: 10 }} />
                            <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 10 }} />
                            <Tooltip 
                              contentStyle={{ 
                                backgroundColor: '#fff', 
                                borderRadius: '16px', 
                                border: 'none', 
                                boxShadow: '0 10px 30px rgba(0,0,0,0.1)' 
                              }} 
                            />
                            <Area type="monotone" dataKey="orders" stroke="#1a56db" fillOpacity={1} fill="url(#colorOrders)" strokeWidth={3} />
                          </AreaChart>
                        </ResponsiveContainer>
                      </div>
                    </div>

                    <div className="bg-surface-container-low rounded-[2.5rem] p-8 border border-primary/5">
                      <h3 className="text-xl font-headline font-black mb-6">User Distribution</h3>
                      <div className="h-[300px]">
                        <ResponsiveContainer width="100%" height="100%">
                          <PieChart>
                            <Pie
                              data={systemStats?.userTypeDist || []}
                              cx="50%"
                              cy="50%"
                              innerRadius={60}
                              outerRadius={80}
                              paddingAngle={5}
                              dataKey="value"
                            >
                              <Cell fill="#1a56db" />
                              <Cell fill="#0e7490" />
                              <Cell fill="#7c3aed" />
                            </Pie>
                            <Tooltip />
                          </PieChart>
                        </ResponsiveContainer>
                        <div className="flex justify-center gap-6 mt-4">
                          {systemStats?.userTypeDist?.map((d: any, i: number) => (
                            <div key={d.name} className="flex items-center gap-2">
                              <div className={cn("w-3 h-3 rounded-full", i === 0 ? "bg-primary" : i === 1 ? "bg-tertiary" : "bg-primary/50")} />
                              <span className="text-[10px] font-black uppercase tracking-widest text-on-surface-variant">{d.name} ({d.value})</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>
                </motion.div>
              )}

              {activeTab === 'settings' && (
                <motion.div 
                  key="settings"
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="bg-surface-container-low rounded-[2.5rem] p-8 border border-primary/5"
                >
                    <div className="flex justify-between items-center mb-10">
                      <div>
                        <h2 className="text-3xl font-headline font-black text-on-surface tracking-tight">System Configuration</h2>
                        <p className="text-on-surface-variant font-medium">Control campus hotspots and global application parameters.</p>
                      </div>
                      {hasFullAdminPrivileges && (
                        <button 
                          onClick={() => {
                            setIsLandmarkModalOpen(true);
                          }}
                          className="signature-gradient text-white px-8 py-4 rounded-2xl font-headline font-bold text-sm shadow-xl active:scale-95 transition-transform flex items-center gap-2"
                        >
                          <Plus className="w-5 h-5" /> ADD NEW HOTSPOT
                        </button>
                      )}
                    </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {siteSettings?.landmarks?.map(lm => (
                      <div key={lm.id} className="bg-surface-container-lowest p-6 rounded-[2rem] border border-primary/5 shadow-sm flex items-center justify-between group">
                        <div className="flex items-center gap-4">
                          <div className={cn("w-10 h-10 rounded-xl flex items-center justify-center", lm.active ? "bg-success/10 text-success" : "bg-error/10 text-error")}>
                            <MapPin className="w-5 h-5" />
                          </div>
                          <div>
                            <p className="font-headline font-black text-on-surface">{lm.name}</p>
                            <p className="text-[8px] font-black uppercase tracking-widest text-on-surface-variant">{lm.active ? 'Operational' : 'Disabled'}</p>
                          </div>
                        </div>
                          <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                            <button 
                              onClick={() => {
                                if (!siteSettings || !hasFullAdminPrivileges) return;
                                const updated = siteSettings.landmarks.map(l => l.id === lm.id ? { ...l, active: !l.active } : l);
                                api.updateSiteSettings({ landmarks: updated }).then(setSiteSettings);
                              }}
                              className="p-2 rounded-lg bg-surface-container-highest text-on-surface-variant hover:text-primary transition-colors disabled:opacity-50"
                              disabled={!hasFullAdminPrivileges}
                            >
                              <Info className="w-4 h-4" />
                            </button>
                            <button 
                              onClick={() => {
                                if (!siteSettings || !hasFullAdminPrivileges) return;
                                if (confirm('Delete hotspot?')) {
                                  const updated = siteSettings.landmarks.filter(l => l.id !== lm.id);
                                  api.updateSiteSettings({ landmarks: updated }).then(setSiteSettings);
                                }
                              }}
                              className="p-2 rounded-lg bg-surface-container-highest text-on-surface-variant hover:text-error transition-colors disabled:opacity-50"
                              disabled={!hasFullAdminPrivileges}
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                      </div>
                    ))}
                    {(siteSettings?.landmarks || []).length === 0 && (
                      <div className="col-span-full py-20 text-center border-4 border-dashed border-primary/10 rounded-[3rem]">
                        <p className="text-on-surface-variant font-medium">No landmarks managed via settings yet.</p>
                      </div>
                    )}
                  </div>

                  {hasFullAdminPrivileges && siteSettings && (
                    <div className="mt-20 border-t border-primary/10 pt-20">
                      <div className="mb-12">
                        <h2 className="text-3xl font-headline font-black text-on-surface tracking-tight">Site Branding</h2>
                        <p className="text-on-surface-variant font-medium">Customize the platform appearance (Super Admin Exclusive).</p>
                      </div>

                      <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
                        <div className="space-y-8">
                          <div className="space-y-2">
                            <label className="text-[10px] font-black uppercase tracking-widest text-on-surface-variant ml-4">Site Name</label>
                            <input 
                              type="text" 
                              value={siteSettings.name}
                              onChange={(e) => setSiteSettings({ ...siteSettings, name: e.target.value })}
                              className="w-full h-16 bg-surface-container-lowest rounded-2xl px-6 font-headline font-bold outline-none focus:ring-4 ring-primary/10 border border-primary/5"
                            />
                          </div>

                          <div className="space-y-2">
                            <label className="text-[10px] font-black uppercase tracking-widest text-on-surface-variant ml-4">Logo URL or Base64</label>
                            <input 
                              type="text" 
                              value={siteSettings.logo}
                              onChange={(e) => setSiteSettings({ ...siteSettings, logo: e.target.value })}
                              placeholder="data:image/png;base64,..."
                              className="w-full h-16 bg-surface-container-lowest rounded-2xl px-6 font-headline font-bold outline-none focus:ring-4 ring-primary/10 border border-primary/5 font-mono text-xs"
                            />
                            <p className="text-[10px] text-on-surface-variant px-4">Leave empty to use default drop icon.</p>
                          </div>

                          <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                              <label className="text-[10px] font-black uppercase tracking-widest text-on-surface-variant ml-4">Contact Phone</label>
                              <input 
                                type="text" 
                                value={siteSettings.contactPhone}
                                onChange={(e) => setSiteSettings({ ...siteSettings, contactPhone: e.target.value })}
                                className="w-full h-16 bg-surface-container-lowest rounded-2xl px-6 font-headline font-bold outline-none focus:ring-4 ring-primary/10 border border-primary/5"
                              />
                            </div>
                            <div className="space-y-2">
                              <label className="text-[10px] font-black uppercase tracking-widest text-on-surface-variant ml-4">Contact Email</label>
                              <input 
                                type="text" 
                                value={siteSettings.contactEmail}
                                onChange={(e) => setSiteSettings({ ...siteSettings, contactEmail: e.target.value })}
                                className="w-full h-16 bg-surface-container-lowest rounded-2xl px-6 font-headline font-bold outline-none focus:ring-4 ring-primary/10 border border-primary/5"
                              />
                            </div>
                          </div>
                        </div>

                        <div className="space-y-8">
                          <div className="space-y-2">
                            <label className="text-[10px] font-black uppercase tracking-widest text-on-surface-variant ml-4">Global Announcement</label>
                            <textarea 
                              value={siteSettings.announcement}
                              onChange={(e) => setSiteSettings({ ...siteSettings, announcement: e.target.value })}
                              className="w-full h-40 bg-surface-container-lowest rounded-2xl p-6 font-medium text-sm outline-none focus:ring-4 ring-primary/10 border border-primary/5 resize-none"
                            />
                          </div>

                          <div className="flex items-center justify-between p-6 bg-surface-container-lowest rounded-2xl border border-primary/5">
                            <div>
                              <p className="font-headline font-black text-on-surface">Maintenance Mode</p>
                              <p className="text-[10px] text-on-surface-variant font-bold uppercase tracking-widest">Blocks user access to all features</p>
                            </div>
                            <button 
                              onClick={() => setSiteSettings({ ...siteSettings, maintenanceMode: !siteSettings.maintenanceMode })}
                              className={cn(
                                "w-16 h-8 rounded-full relative transition-colors",
                                siteSettings.maintenanceMode ? "bg-error" : "bg-primary/20"
                              )}
                            >
                              <div className={cn(
                                "w-6 h-6 bg-white rounded-full absolute top-1 transition-all",
                                siteSettings.maintenanceMode ? "right-1" : "left-1"
                              )} />
                            </button>
                          </div>

                          <button 
                            disabled={isSiteUpdating}
                            onClick={async () => {
                              try {
                                setIsSiteUpdating(true);
                                await api.updateSiteSettings(siteSettings);
                                alert('Site settings propagated! All users will see the changes.');
                              } catch (error: any) {
                                console.error('Failed to update settings:', error);
                                alert(`Update failed: ${error.message}`);
                              } finally {
                                setIsSiteUpdating(false);
                              }
                            }}
                            className="w-full h-20 signature-gradient text-white rounded-3xl font-headline font-black text-lg shadow-2xl shadow-primary/20 active:scale-[0.98] transition-all flex items-center justify-center gap-3"
                          >
                            {isSiteUpdating ? 'PROPAGATING...' : 'PUBLISH CHANGES'}
                            <Globe className="w-6 h-6" />
                          </button>
                        </div>
                      </div>
                    </div>
                  )}
                </motion.div>
              )}

              {activeTab === 'orders' && (
                <motion.div 
                  key="orders"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  className="space-y-8"
                >
                  <div className="bg-surface-container-low rounded-[2.5rem] p-8 border border-primary/5">
                    <h2 className="text-2xl font-headline font-black text-on-surface mb-8">Order Management</h2>
                    <div className="overflow-x-auto">
                      <table className="w-full text-left">
                        <thead>
                          <tr className="border-b border-primary/5">
                            <th className="pb-4 font-label text-[10px] font-black uppercase tracking-widest text-on-surface-variant">Order ID</th>
                            <th className="pb-4 font-label text-[10px] font-black uppercase tracking-widest text-on-surface-variant">Customer</th>
                            <th className="pb-4 font-label text-[10px] font-black uppercase tracking-widest text-on-surface-variant">Status</th>
                            <th className="pb-4 font-label text-[10px] font-black uppercase tracking-widest text-on-surface-variant">Rider</th>
                            <th className="pb-4 font-label text-[10px] font-black uppercase tracking-widest text-on-surface-variant">Actions</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-primary/5">
                          {orders.map(o => (
                            <tr key={o.id} className="group hover:bg-surface-container-lowest transition-colors">
                              <td className="py-4 font-headline font-bold text-sm">#{o.id}</td>
                              <td className="py-4">
                                <p className="font-headline font-bold text-sm">{o.customerName}</p>
                                <p className="text-[10px] text-on-surface-variant">{o.customerPhone}</p>
                              </td>
                              <td className="py-4">
                                <span className={cn(
                                  "px-3 py-1 rounded-full text-[8px] font-black uppercase tracking-widest",
                                  o.color || "bg-primary-container text-primary"
                                )}>
                                  {o.status}
                                </span>
                              </td>
                              <td className="py-4">
                                {o.riderPhone ? (
                                  <div className="flex items-center gap-2">
                                    <Bike className="w-4 h-4 text-primary" />
                                    <span className="text-xs font-bold">{riders.find(r => r.phoneNumber === o.riderPhone)?.fullName || o.riderPhone}</span>
                                  </div>
                                ) : (
                                  <select 
                                    onChange={(e) => assignRider(o.id, e.target.value)}
                                    className="bg-surface-container-highest text-[10px] font-black uppercase tracking-widest px-2 py-1 rounded-md outline-none border-none"
                                  >
                                    <option value="">Assign Rider</option>
                                    {riders.map(r => (
                                      <option key={r.phoneNumber} value={r.phoneNumber}>{r.fullName}</option>
                                    ))}
                                  </select>
                                )}
                              </td>
                              <td className="py-4">
                                <button 
                                  onClick={() => {
                                    setSelectedDetail({ type: 'Order', ...o });
                                    setIsDetailModalOpen(true);
                                  }}
                                  className="p-2 rounded-lg bg-surface-container-highest text-on-surface-variant hover:text-primary transition-colors"
                                >
                                  <ExternalLink className="w-4 h-4" />
                                </button>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </motion.div>
              )}

              {activeTab === 'users' && (
                <motion.div 
                  key="users"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  className="bg-surface-container-low rounded-[2.5rem] p-8 border border-primary/5"
                >
                  <div className="flex justify-between items-center mb-8">
                    <h2 className="text-2xl font-headline font-black text-on-surface">User Management</h2>
                    <button 
                      onClick={() => setIsAddUserModalOpen(true)}
                      className="signature-gradient text-white px-6 py-3 rounded-xl font-headline font-bold text-xs flex items-center gap-2 shadow-lg active:scale-95 transition-transform"
                    >
                      <UserPlus className="w-4 h-4" /> Add User
                    </button>
                  </div>

                  {/* User Sub-Tabs */}
                  <div className="flex gap-2 mb-8 overflow-x-auto pb-2 hide-scrollbar">
                    {['all', 'admin', 'vendor', 'rider', 'customer', 'marketing'].map((section) => (
                      <button
                        key={section}
                        onClick={() => setUserSection(section as any)}
                        className={cn(
                          "px-6 py-3 rounded-xl font-headline font-bold text-[10px] uppercase tracking-widest transition-all",
                          userSection === section ? "bg-primary text-on-primary shadow-md" : "bg-surface-container-highest text-on-surface-variant hover:bg-primary/10"
                        )}
                      >
                        {section}
                      </button>
                    ))}
                  </div>

                  <div className="overflow-x-auto">
                    <table className="w-full text-left">
                      <thead>
                        <tr className="border-b border-primary/5">
                          <th className="pb-4 font-label text-[10px] font-black uppercase tracking-widest text-on-surface-variant">User</th>
                          <th className="pb-4 font-label text-[10px] font-black uppercase tracking-widest text-on-surface-variant">Role</th>
                          <th className="pb-4 font-label text-[10px] font-black uppercase tracking-widest text-on-surface-variant">Status</th>
                          <th className="pb-4 font-label text-[10px] font-black uppercase tracking-widest text-on-surface-variant">Trust Points</th>
                          <th className="pb-4 font-label text-[10px] font-black uppercase tracking-widest text-on-surface-variant">Actions</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-primary/5">
                        {allUsers
                          .filter(u => userSection === 'all' || u.role === userSection)
                          .filter(u => {
                            const isUserSuperAdmin = u.email === 'ogunweoluwadebo1@gmail.com' || u.email === 'ogunwedebo21@gmail.com' || u.phoneNumber === '07048865686';
                            if (isUserSuperAdmin && !isSuperAdmin) return false;
                            return true;
                          })
                          .map(u => (
                          <tr key={u.phoneNumber} className="group hover:bg-surface-container-lowest transition-colors">
                            <td className="py-4">
                              <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-full bg-surface-container-highest flex items-center justify-center font-bold text-primary">
                                  {u.fullName?.[0]}
                                </div>
                                <div>
                                  <p className="font-headline font-bold text-sm">{u.fullName}</p>
                                  <p className="text-[10px] text-on-surface-variant">{u.phoneNumber}</p>
                                </div>
                              </div>
                            </td>
                            <td className="py-4">
                              <span className="font-label text-[10px] font-black uppercase tracking-widest text-primary bg-primary/5 px-2 py-1 rounded-md">
                                {u.role}
                              </span>
                            </td>
                            <td className="py-4">
                              <div className="flex flex-col gap-1">
                                <span className={cn(
                                  "px-3 py-1 rounded-full text-[8px] font-black uppercase tracking-widest inline-block w-fit",
                                  u.status === 'restricted' ? "bg-warning text-on-warning" : 
                                  u.status === 'suspended' ? "bg-error text-on-error" :
                                  u.isApproved ? "bg-success/10 text-success" : "bg-warning/10 text-warning"
                                )}>
                                  {u.status || (u.isApproved ? 'Approved' : 'Pending')}
                                </span>
                              </div>
                            </td>
                            <td className="py-4 font-headline font-black text-sm">{u.trustPoints || 0}</td>
                            <td className="py-4">
                              <div className="flex gap-2">
                                {((u.role !== 'admin' && u.role !== 'super-sub-admin') || isSuperAdmin) && (
                                  <button 
                                    onClick={() => handleEditUser(u)}
                                    className="p-2 rounded-lg bg-surface-container-highest text-on-surface-variant hover:text-primary transition-colors"
                                    title="Edit User"
                                  >
                                    <Edit3 className="w-4 h-4" />
                                  </button>
                                )}
                                {hasFullAdminPrivileges && (u.role !== 'admin' || isSuperAdmin) && (
                                  <>
                                    <button 
                                      onClick={() => handleRestrictUser(u.uid, u.status === 'restricted' ? 'active' : 'restricted')}
                                      className={cn(
                                        "p-2 rounded-lg bg-surface-container-highest transition-colors",
                                        u.status === 'restricted' ? "text-success hover:bg-success/10" : "text-warning hover:bg-warning/10"
                                      )}
                                      title={u.status === 'restricted' ? "Unrestrict User" : "Restrict User"}
                                    >
                                      <ShieldCheck className="w-4 h-4" />
                                    </button>
                                    <button 
                                      onClick={() => handleRestrictUser(u.uid, u.status === 'suspended' ? 'active' : 'suspended')}
                                      className={cn(
                                        "p-2 rounded-lg bg-surface-container-highest transition-colors",
                                        u.status === 'suspended' ? "text-success hover:bg-success/10" : "text-error hover:bg-error/10"
                                      )}
                                      title={u.status === 'suspended' ? "Unban User" : "Ban User"}
                                    >
                                      <XIcon className="w-4 h-4" />
                                    </button>
                                  </>
                                )}
                                {hasFullAdminPrivileges && (u.role !== 'admin' || isSuperAdmin) && (
                                  <button 
                                    onClick={() => handleDeleteUser(u.uid)}
                                    className="p-2 rounded-lg bg-surface-container-highest text-on-surface-variant hover:text-error transition-colors"
                                    title="Delete User"
                                  >
                                    <Trash2 className="w-4 h-4" />
                                  </button>
                                )}
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </motion.div>
              )}

              {activeTab === 'audit' && (
                <motion.div 
                  key="audit"
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="bg-surface-container-low rounded-[2.5rem] p-8 border border-primary/5"
                >
                  <h2 className="text-2xl font-headline font-black text-on-surface mb-8">System Audit Log</h2>
                  <div className="space-y-4">
                    {[...auditLogs].reverse().map((log: any) => (
                      <div 
                        key={log.id} 
                        onClick={() => {
                          setSelectedDetail({ type: 'Audit Log', ...log });
                          setIsDetailModalOpen(true);
                        }}
                        className="flex items-center justify-between p-4 bg-surface-container-lowest rounded-2xl border border-primary/5 cursor-pointer hover:border-primary/20 transition-all"
                      >
                        <div className="flex items-center gap-4">
                          <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center text-primary">
                            <History className="w-5 h-5" />
                          </div>
                          <div>
                            <p className="font-headline font-bold text-sm">{log.action}</p>
                            <p className="text-[10px] text-on-surface-variant">Admin: {log.admin} • Target: {log.target}</p>
                          </div>
                        </div>
                        <span className="text-[10px] font-bold text-on-surface-variant">{new Date(log.time).toLocaleString()}</span>
                      </div>
                    ))}
                    {auditLogs.length === 0 && (
                      <div className="py-20 text-center border-2 border-dashed border-primary/10 rounded-3xl">
                        <p className="text-on-surface-variant font-medium">No audit logs found.</p>
                      </div>
                    )}
                  </div>
                </motion.div>
              )}

              {activeTab === 'wallets' && (
                <motion.div 
                  key="wallets"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="space-y-8"
                >
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    {isSuperAdmin && (
                      <div className="bg-primary text-on-primary p-8 rounded-[2.5rem] shadow-xl">
                        <p className="font-label text-[10px] font-black uppercase tracking-widest opacity-80 mb-2">Platform Commission</p>
                        <h3 className="text-4xl font-headline font-black">
                          ₦{allTransactions
                            .filter(t => t.type === 'commission' && t.status === 'completed')
                            .reduce((acc, t) => acc + t.amount, 0)
                            .toLocaleString()}
                        </h3>
                      </div>
                    )}
                    <div className="bg-surface-container-low p-8 rounded-[2.5rem] border border-primary/5">
                      <div className="flex justify-between items-start mb-2">
                        <p className="font-label text-[10px] font-black uppercase tracking-widest text-on-surface-variant">Total Payouts</p>
                        <button onClick={() => setHistoryModal({ open: true, type: 'payout' })} className="text-[10px] font-black text-primary hover:underline">HISTORY</button>
                      </div>
                      <h3 className="text-4xl font-headline font-black text-on-surface">
                        ₦{allTransactions
                          .filter(t => t.type === 'payout' && t.status === 'completed')
                          .reduce((acc, t) => acc + t.amount, 0)
                          .toLocaleString()}
                      </h3>
                    </div>
                    <div className="bg-surface-container-low p-8 rounded-[2.5rem] border border-primary/5">
                      <div className="flex justify-between items-start mb-2">
                        <p className="font-label text-[10px] font-black uppercase tracking-widest text-on-surface-variant">Pending Withdrawals</p>
                        <button onClick={() => setHistoryModal({ open: true, type: 'withdrawal' })} className="text-[10px] font-black text-primary hover:underline">HISTORY</button>
                      </div>
                      <h3 className="text-4xl font-headline font-black text-warning">
                        ₦{allTransactions
                          .filter(t => t.type === 'withdrawal' && t.status === 'pending')
                          .reduce((acc, t) => acc + t.amount, 0)
                          .toLocaleString()}
                      </h3>
                    </div>
                  </div>

                  <div className="bg-surface-container-low rounded-[2.5rem] p-8 border border-primary/5">
                    <h2 className="text-2xl font-headline font-black text-on-surface mb-8">Withdrawal Requests</h2>
                    <div className="space-y-4">
                      {allUsers.filter(u => u.withdrawalRequested).map(u => (
                        <div key={u.phoneNumber} className="flex items-center justify-between p-6 bg-surface-container-lowest rounded-3xl border border-primary/5">
                          <div className="flex items-center gap-4">
                            <div className="w-12 h-12 rounded-2xl bg-primary/10 flex items-center justify-center text-primary">
                              <Wallet className="w-6 h-6" />
                            </div>
                            <div>
                              <p className="font-headline font-bold text-lg">{u.fullName}</p>
                              <p className="text-xs text-on-surface-variant">{u.role} • {u.phoneNumber}</p>
                            </div>
                          </div>
                          <div className="flex items-center gap-6">
                            <div className="text-right">
                              <p className="text-xs font-black text-primary">₦{(u.walletBalance || 0).toLocaleString()}</p>
                              <p className="text-[10px] text-on-surface-variant">Requested 2h ago</p>
                            </div>
                            <button className="h-12 px-6 bg-primary text-on-primary rounded-xl font-headline font-bold text-xs active:scale-95 transition-transform">
                              Approve Payout
                            </button>
                          </div>
                        </div>
                      ))}
                      {allUsers.filter(u => u.withdrawalRequested).length === 0 && (
                        <div className="py-20 text-center border-2 border-dashed border-primary/10 rounded-3xl">
                          <p className="text-on-surface-variant font-medium">No pending withdrawal requests.</p>
                        </div>
                      )}
                    </div>
                  </div>
                </motion.div>
              )}

              {activeTab === 'disputes' && (
                <motion.div 
                  key="disputes"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  className="space-y-6"
                >
                  <div className="bg-surface-container-low rounded-[2.5rem] p-8 border border-primary/5">
                    <h2 className="text-2xl font-headline font-black text-on-surface mb-8">Active Disputes</h2>
                    <div className="space-y-4">
                      {orders.filter(o => o.status === 'disputed').map(o => (
                        <div key={o.id} className="p-6 bg-surface-container-lowest rounded-3xl border border-error/20">
                          <div className="flex justify-between items-start mb-4">
                            <div className="flex items-center gap-4">
                              <div className="w-12 h-12 rounded-2xl bg-error/10 flex items-center justify-center text-error">
                                <AlertTriangle className="w-6 h-6" />
                              </div>
                              <div>
                                <h4 className="font-headline font-black text-lg text-on-surface">Order #{o.id}</h4>
                                <p className="text-xs font-bold text-on-surface-variant">Customer: {o.customerName}</p>
                              </div>
                            </div>
                            <span className="bg-error text-on-error px-3 py-1 rounded-full text-[8px] font-black uppercase tracking-widest">High Priority</span>
                          </div>
                          <div className="space-y-4 mb-6">
                            <div className="space-y-2">
                              <p className="text-[10px] font-black uppercase tracking-widest text-primary">Customer Complaint:</p>
                              <p className="text-sm text-on-surface-variant bg-surface-container p-4 rounded-xl italic">
                                &quot;{o.issueDescription || 'No description provided.'}&quot;
                              </p>
                            </div>
                            
                            {o.evidenceImage && (
                              <div className="space-y-2">
                                <p className="text-[10px] font-black uppercase tracking-widest text-primary">Customer Evidence:</p>
                                <div className="relative aspect-video w-full rounded-2xl overflow-hidden border-2 border-primary/10">
                                  <Image 
                                    src={o.evidenceImage} 
                                    alt="Dispute Evidence" 
                                    fill 
                                    className="object-cover"
                                    referrerPolicy="no-referrer"
                                  />
                                </div>
                              </div>
                            )}

                            {o.vendorEvidenceImage && (
                              <div className="space-y-2">
                                <p className="text-[10px] font-black uppercase tracking-widest text-success">Vendor Counter-Evidence:</p>
                                <div className="relative aspect-video w-full rounded-2xl overflow-hidden border-2 border-success/10">
                                  <Image 
                                    src={o.vendorEvidenceImage} 
                                    alt="Vendor Evidence" 
                                    fill 
                                    className="object-cover"
                                    referrerPolicy="no-referrer"
                                  />
                                </div>
                              </div>
                            )}

                            {!o.evidenceImage && !o.vendorEvidenceImage && (
                              <div className="p-4 bg-surface-container rounded-xl flex items-center gap-3">
                                <Info className="w-4 h-4 text-on-surface-variant" />
                                <p className="text-xs text-on-surface-variant font-medium">No visual evidence uploaded for this dispute.</p>
                              </div>
                            )}
                          </div>

                          <div className="flex gap-3">
                            <button 
                              onClick={() => {
                                setResolvingOrder(o);
                                setRefundAmount(o.totalPrice);
                                setIsRefundModalOpen(true);
                              }}
                              className="flex-1 h-12 bg-primary text-on-primary rounded-xl font-headline font-bold text-xs active:scale-95 transition-transform"
                            >
                              Resolve/Refund
                            </button>
                            <button 
                              onClick={() => handleResolveDispute(o.id, 'reject')}
                              className="flex-1 h-12 bg-surface-container-highest text-on-surface rounded-xl font-headline font-bold text-xs active:scale-95 transition-transform"
                            >
                              Reject Dispute
                            </button>
                          </div>
                        </div>
                      ))}
                      {orders.filter(o => o.status === 'disputed').length === 0 && (
                        <div className="py-20 text-center border-2 border-dashed border-primary/10 rounded-3xl">
                          <p className="text-on-surface-variant font-medium">No active disputes. Great job!</p>
                        </div>
                      )}
                    </div>
                  </div>
                </motion.div>
              )}

      {/* Duplicate analytics block removed */}

              {activeTab === 'marketing' && (
                <motion.div 
                  key="marketing"
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="space-y-8"
                >
                  <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    <div className="lg:col-span-2 bg-surface-container-low p-8 rounded-[2.5rem] border border-primary/5">
                      <div className="flex justify-between items-center mb-8">
                        <h2 className="text-2xl font-headline font-black text-on-surface">Active Campaigns</h2>
                        <button 
                          onClick={() => {
                            setEditingCampaign(null);
                            setCampaignForm({ name: '', status: 'Active', reach: '0', conversion: '0%', color: 'bg-primary' });
                            setIsCampaignModalOpen(true);
                          }}
                          className="signature-gradient text-white px-6 py-3 rounded-xl font-headline font-bold text-xs shadow-lg active:scale-95 transition-transform"
                        >
                          Create New
                        </button>
                      </div>
                      <div className="space-y-4">
                        {campaigns.map(c => (
                          <div key={c.id} className="flex items-center justify-between p-6 bg-surface-container-lowest rounded-3xl border border-primary/5 group">
                            <div className="flex items-center gap-4">
                              <div className={cn("w-12 h-12 rounded-2xl flex items-center justify-center text-white", c.color)}>
                                <Megaphone className="w-6 h-6" />
                              </div>
                              <div>
                                <h4 className="font-headline font-bold text-lg">{c.name}</h4>
                                <p className="text-xs text-on-surface-variant">Status: {c.status}</p>
                              </div>
                            </div>
                            <div className="flex gap-8 items-center">
                              <div className="text-right">
                                <p className="text-[10px] font-black uppercase tracking-widest text-on-surface-variant">Reach</p>
                                <p className="font-headline font-black">{c.reach}</p>
                              </div>
                              <div className="text-right">
                                <p className="text-[10px] font-black uppercase tracking-widest text-on-surface-variant">Conv.</p>
                                <p className="font-headline font-black text-primary">{c.conversion}</p>
                              </div>
                              <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                <button 
                                  onClick={() => {
                                    setEditingCampaign(c);
                                    setCampaignForm({ ...c });
                                    setIsCampaignModalOpen(true);
                                  }}
                                  className="p-2 rounded-lg bg-surface-container-highest text-on-surface-variant hover:text-primary transition-colors"
                                >
                                  <Edit3 className="w-4 h-4" />
                                </button>
                                <button 
                                  onClick={() => setCampaignToDelete(c.id)}
                                  className="p-2 rounded-lg bg-surface-container-highest text-on-surface-variant hover:text-error transition-colors"
                                >
                                  <Trash2 className="w-4 h-4" />
                                </button>
                              </div>
                            </div>
                          </div>
                        ))}
                        {campaigns.length === 0 && (
                          <div className="py-20 text-center border-2 border-dashed border-primary/10 rounded-3xl">
                            <p className="text-on-surface-variant font-medium">No active campaigns.</p>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Delete Confirmation Modal */}
                    {campaignToDelete && (
                      <div className="fixed inset-0 z-[110] flex items-center justify-center p-6">
                        <motion.div 
                          initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                          className="absolute inset-0 bg-surface/60 backdrop-blur-md"
                          onClick={() => setCampaignToDelete(null)}
                        />
                        <motion.div 
                          initial={{ opacity: 0, scale: 0.9 }}
                          animate={{ opacity: 1, scale: 1 }}
                          className="relative w-full max-w-sm bg-surface-container-low rounded-[2rem] p-8 border border-error/20 shadow-2xl text-center"
                        >
                          <div className="w-16 h-16 bg-error/10 text-error rounded-full flex items-center justify-center mx-auto mb-6">
                            <Trash2 className="w-8 h-8" />
                          </div>
                          <h3 className="text-xl font-headline font-black mb-2">Delete Campaign?</h3>
                          <p className="text-on-surface-variant text-sm mb-8">This action cannot be undone. All campaign data will be permanently removed.</p>
                          <div className="flex gap-4">
                            <button 
                              onClick={() => setCampaignToDelete(null)}
                              className="flex-1 h-12 bg-surface-container-highest text-on-surface rounded-xl font-bold text-xs"
                            >
                              CANCEL
                            </button>
                            <button 
                              onClick={() => handleDeleteCampaign(campaignToDelete)}
                              className="flex-1 h-12 bg-error text-white rounded-xl font-bold text-xs shadow-lg shadow-error/20"
                            >
                              DELETE
                            </button>
                          </div>
                        </motion.div>
                      </div>
                    )}

                    <div className="bg-surface-container-low p-8 rounded-[2.5rem] border border-primary/5">
                      <h2 className="text-2xl font-headline font-black text-on-surface mb-8">Push Notifications</h2>
                      <div className="space-y-6">
                      <div className="space-y-2">
                        <label className="text-[10px] font-black uppercase tracking-widest text-on-surface-variant ml-2">Target Audience</label>
                        <select 
                          value={broadcastAudience}
                          onChange={(e) => setBroadcastAudience(e.target.value)}
                          className="w-full h-12 bg-surface-container-lowest rounded-xl px-4 font-bold text-sm outline-none border border-primary/5"
                        >
                          <option>All Users</option>
                          <option>Customers Only</option>
                          <option>Vendors Only</option>
                          <option>Riders Only</option>
                        </select>
                      </div>
                      <div className="space-y-2">
                        <label className="text-[10px] font-black uppercase tracking-widest text-on-surface-variant ml-2">Message</label>
                        <textarea 
                          placeholder="Type your broadcast message..."
                          value={broadcastMessage}
                          onChange={(e) => setBroadcastMessage(e.target.value)}
                          className="w-full h-32 bg-surface-container-lowest rounded-xl p-4 font-medium text-sm outline-none border border-primary/5 resize-none"
                        />
                      </div>
                      <button 
                        onClick={() => {
                          if (!broadcastMessage) return alert('Please enter a message.');
                          alert(`Broadcast sent to ${broadcastAudience}: ${broadcastMessage}`);
                          setBroadcastMessage('');
                        }}
                        className="w-full h-14 bg-primary text-on-primary rounded-2xl font-headline font-black text-sm shadow-lg active:scale-95 transition-transform"
                      >
                        SEND BROADCAST
                      </button>
                      </div>
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Campaign Modal */}
            {isCampaignModalOpen && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-6">
                  <motion.div 
                    initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                    className="absolute inset-0 bg-surface/80 backdrop-blur-xl"
                    onClick={() => setIsCampaignModalOpen(false)}
                  />
                  <motion.div 
                    initial={{ opacity: 0, scale: 0.9, y: 20 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    className="relative w-full max-w-lg bg-surface-container-low rounded-[3rem] p-10 border border-primary/10 shadow-2xl overflow-y-auto max-h-[90vh]"
                  >
                    <h2 className="text-3xl font-headline font-black text-on-surface mb-8 tracking-tighter">
                      {editingCampaign ? 'Edit Campaign' : 'Create New Campaign'}
                    </h2>
                    <form onSubmit={handleAddCampaign} className="space-y-6">
                      <div className="space-y-2">
                        <label className="text-[10px] font-black uppercase tracking-widest text-on-surface-variant ml-4">Campaign Name</label>
                        <input 
                          type="text" 
                          required
                          value={campaignForm.name}
                          onChange={(e) => setCampaignForm({ ...campaignForm, name: e.target.value })}
                          className="w-full h-14 bg-surface-container-lowest rounded-2xl px-6 font-headline font-bold outline-none focus:ring-2 ring-primary"
                        />
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <label className="text-[10px] font-black uppercase tracking-widest text-on-surface-variant ml-4">Status</label>
                          <select 
                            value={campaignForm.status}
                            onChange={(e) => setCampaignForm({ ...campaignForm, status: e.target.value })}
                            className="w-full h-14 bg-surface-container-lowest rounded-2xl px-6 font-headline font-bold outline-none focus:ring-2 ring-primary"
                          >
                            <option value="Active">Active</option>
                            <option value="Scheduled">Scheduled</option>
                            <option value="Paused">Paused</option>
                            <option value="Completed">Completed</option>
                          </select>
                        </div>
                        <div className="space-y-2">
                          <label className="text-[10px] font-black uppercase tracking-widest text-on-surface-variant ml-4">Color Theme</label>
                          <select 
                            value={campaignForm.color}
                            onChange={(e) => setCampaignForm({ ...campaignForm, color: e.target.value })}
                            className="w-full h-14 bg-surface-container-lowest rounded-2xl px-6 font-headline font-bold outline-none focus:ring-2 ring-primary"
                          >
                            <option value="bg-primary">Purple (Primary)</option>
                            <option value="bg-secondary">Blue (Secondary)</option>
                            <option value="bg-tertiary">Teal (Tertiary)</option>
                            <option value="bg-success">Green (Success)</option>
                            <option value="bg-warning">Orange (Warning)</option>
                            <option value="bg-error">Red (Error)</option>
                          </select>
                        </div>
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <label className="text-[10px] font-black uppercase tracking-widest text-on-surface-variant ml-4">Reach</label>
                          <input 
                            type="text" 
                            required
                            value={campaignForm.reach}
                            onChange={(e) => setCampaignForm({ ...campaignForm, reach: e.target.value })}
                            className="w-full h-14 bg-surface-container-lowest rounded-2xl px-6 font-headline font-bold outline-none focus:ring-2 ring-primary"
                          />
                        </div>
                        <div className="space-y-2">
                          <label className="text-[10px] font-black uppercase tracking-widest text-on-surface-variant ml-4">Conversion</label>
                          <input 
                            type="text" 
                            required
                            value={campaignForm.conversion}
                            onChange={(e) => setCampaignForm({ ...campaignForm, conversion: e.target.value })}
                            className="w-full h-14 bg-surface-container-lowest rounded-2xl px-6 font-headline font-bold outline-none focus:ring-2 ring-primary"
                          />
                        </div>
                      </div>
                      <div className="flex gap-4 pt-4">
                        <button 
                          type="button"
                          onClick={() => setIsCampaignModalOpen(false)}
                          className="flex-1 h-14 bg-surface-container-highest text-on-surface rounded-2xl font-headline font-black text-sm active:scale-95 transition-transform"
                        >
                          CANCEL
                        </button>
                        <button 
                          type="submit"
                          className="flex-1 h-14 signature-gradient text-white rounded-2xl font-headline font-black text-sm shadow-lg active:scale-95 transition-transform"
                        >
                          {editingCampaign ? 'SAVE CHANGES' : 'CREATE CAMPAIGN'}
                        </button>
                      </div>
                    </form>
                  </motion.div>
                </div>
              )}

              {/* Landmark Modal */}
              {isLandmarkModalOpen && (
                <div className="fixed inset-0 z-[110] flex items-center justify-center p-6">
                  <motion.div 
                    initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                    className="absolute inset-0 bg-surface/80 backdrop-blur-xl"
                    onClick={() => setIsLandmarkModalOpen(false)}
                  />
                  <motion.div 
                    initial={{ opacity: 0, scale: 0.9, y: 20 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    className="relative w-full max-w-sm bg-surface-container-low rounded-[3rem] p-10 border border-primary/10 shadow-2xl"
                  >
                    <h2 className="text-2xl font-headline font-black text-on-surface mb-6 tracking-tighter">Add New Hotspot</h2>
                    <div className="space-y-6">
                      <div className="space-y-2">
                        <label className="text-[10px] font-black uppercase tracking-widest text-on-surface-variant ml-4">Hotspot Name</label>
                        <input 
                          type="text" 
                          placeholder="e.g. Under G Hub"
                          value={newLandmarkName}
                          onChange={(e) => setNewLandmarkName(e.target.value)}
                          className="w-full h-14 bg-surface-container-lowest rounded-2xl px-6 font-headline font-bold outline-none border border-primary/5 focus:border-primary"
                        />
                      </div>
                      <div className="flex gap-3">
                        <button 
                          onClick={() => setIsLandmarkModalOpen(false)}
                          className="flex-1 h-12 bg-surface-container-highest text-on-surface rounded-xl font-headline font-bold text-xs"
                        >
                          CANCEL
                        </button>
                        <button 
                          onClick={() => {
                            if (!newLandmarkName || !siteSettings) return;
                            const newLandmark = { id: Date.now().toString(), name: newLandmarkName, active: true };
                            const updatedLandmarks = [...(siteSettings.landmarks || []), newLandmark];
                            
                            api.updateSiteSettings({ landmarks: updatedLandmarks }).then(updated => {
                              setSiteSettings(updated);
                              setIsLandmarkModalOpen(false);
                              setNewLandmarkName('');
                              alert('Hotspot added!');
                            });
                          }}
                          className="flex-1 h-12 signature-gradient text-white rounded-xl font-headline font-bold text-xs shadow-lg"
                        >
                          ADD HOTSPOT
                        </button>
                      </div>
                    </div>
                  </motion.div>
                </div>
              )}

              {/* Add User Modal */}
              {isAddUserModalOpen && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-6">
                  <motion.div 
                    initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                    className="absolute inset-0 bg-surface/80 backdrop-blur-xl"
                    onClick={() => setIsAddUserModalOpen(false)}
                  />
                  <motion.div 
                    initial={{ opacity: 0, scale: 0.9, y: 20 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    className="relative w-full max-w-lg bg-surface-container-low rounded-[3rem] p-10 border border-primary/10 shadow-2xl overflow-y-auto max-h-[90vh]"
                  >
                    <h2 className="text-3xl font-headline font-black text-on-surface mb-8 tracking-tighter">
                      {newUser.role.includes('admin') ? 'Invite New Admin' : 'Add New User'}
                    </h2>
                    
                    {inviteLink ? (
                      <div className="space-y-6">
                        <div className="p-6 bg-primary/5 border-2 border-dashed border-primary/20 rounded-3xl text-center">
                          <Zap className="w-10 h-10 text-primary mx-auto mb-4" />
                          <h3 className="text-xl font-headline font-black text-primary mb-2">Invite Link Ready</h3>
                          
                          {/* Admin Details - Fixed & Immutable */}
                          <div className="mb-6 p-4 bg-surface-container-lowest rounded-2xl border border-primary/10 text-left">
                            <div className="mb-3">
                              <p className="text-[10px] font-black uppercase tracking-widest text-on-surface-variant mb-1">Target Name</p>
                              <p className="font-headline font-bold text-on-surface">{newUser.fullName}</p>
                            </div>
                            <div>
                              <p className="text-[10px] font-black uppercase tracking-widest text-on-surface-variant mb-1">Target Email</p>
                              <p className="font-headline font-bold text-on-surface">{newUser.email}</p>
                            </div>
                          </div>

                          <div className="p-4 bg-surface-container-lowest rounded-xl break-all font-mono text-xs mb-4 border border-primary/5 select-all">
                            {inviteLink}
                          </div>
                          
                          <button 
                            onClick={async () => {
                              try {
                                if (navigator.clipboard && navigator.clipboard.writeText) {
                                  await navigator.clipboard.writeText(inviteLink);
                                  setNotification({ message: 'Link copied to clipboard!', type: 'success' });
                                } else {
                                  const textArea = document.createElement("textarea");
                                  textArea.value = inviteLink;
                                  document.body.appendChild(textArea);
                                  textArea.select();
                                  document.execCommand('copy');
                                  document.body.removeChild(textArea);
                                  setNotification({ message: 'Link copied to clipboard!', type: 'success' });
                                }
                              } catch (err) {
                                setNotification({ message: 'Failed to copy. Please manually copy the link above.', type: 'error' });
                              }
                            }}
                            className="h-14 w-full signature-gradient text-white rounded-2xl font-headline font-black text-sm shadow-lg active:scale-95 transition-transform"
                          >
                            COPY INVITE LINK
                          </button>
                        </div>
                        <button 
                          onClick={() => { 
                            setIsAddUserModalOpen(false); 
                            setInviteLink(null); 
                            setNewUser({ fullName: '', phoneNumber: '', email: '', password: '', role: 'customer', status: 'active', isApproved: true });
                          }}
                          className="w-full h-14 bg-surface-container-highest text-on-surface rounded-2xl font-headline font-black text-sm active:scale-95 transition-transform"
                        >
                          CLOSE
                        </button>
                      </div>
                    ) : (newUser.role === 'admin' || newUser.role === 'super-sub-admin') ? (
                      <form onSubmit={handleAddUser} className="space-y-6">
                        <div className="space-y-2">
                          <label className="text-[10px] font-black uppercase tracking-widest text-on-surface-variant ml-4">Full Name</label>
                          <input 
                            type="text" 
                            required
                            value={newUser.fullName}
                            onChange={(e) => setNewUser({ ...newUser, fullName: e.target.value })}
                            className="w-full h-14 bg-surface-container-lowest rounded-2xl px-6 font-headline font-bold outline-none focus:ring-2 ring-primary"
                          />
                        </div>
                        <div className="space-y-2">
                          <label className="text-[10px] font-black uppercase tracking-widest text-on-surface-variant ml-4">Email Address</label>
                          <input 
                            type="email" 
                            required
                            value={newUser.email}
                            onChange={(e) => setNewUser({ ...newUser, email: e.target.value })}
                            className="w-full h-14 bg-surface-container-lowest rounded-2xl px-6 font-headline font-bold outline-none focus:ring-2 ring-primary"
                          />
                        </div>
                        <div className="space-y-2">
                          <label className="text-[10px] font-black uppercase tracking-widest text-on-surface-variant ml-4">Role</label>
                          <select 
                            value={newUser.role}
                            onChange={(e) => setNewUser({ ...newUser, role: e.target.value as any })}
                            className="w-full h-14 bg-surface-container-lowest rounded-2xl px-6 font-headline font-bold outline-none focus:ring-2 ring-primary"
                          >
                            {hasFullAdminPrivileges && <option value="admin">Moderator Admin</option>}
                            {hasFullAdminPrivileges && <option value="super-sub-admin">Super Admin (Sub)</option>}
                          </select>
                        </div>
                        <div className="flex gap-4 pt-4">
                          <button 
                            type="button"
                            onClick={() => setIsAddUserModalOpen(false)}
                            className="flex-1 h-14 bg-surface-container-highest text-on-surface rounded-2xl font-headline font-black text-sm active:scale-95 transition-transform"
                          >
                            CANCEL
                          </button>
                          <button 
                            type="submit"
                            className="flex-1 h-14 bg-primary text-on-primary rounded-2xl font-headline font-black text-sm active:scale-95 transition-transform"
                          >
                            GENERATE LINK
                          </button>
                        </div>
                      </form>
                    ) : (
                      <form onSubmit={handleAddUser} className="space-y-6">
                        <div className="space-y-2">
                          <label className="text-[10px] font-black uppercase tracking-widest text-on-surface-variant ml-4">Full Name</label>
                          <input 
                            type="text" 
                            required
                            value={newUser.fullName}
                            onChange={(e) => setNewUser({ ...newUser, fullName: e.target.value })}
                            className="w-full h-14 bg-surface-container-lowest rounded-2xl px-6 font-headline font-bold outline-none focus:ring-2 ring-primary"
                          />
                        </div>

                        <>
                          <div className="space-y-2">
                            <label className="text-[10px] font-black uppercase tracking-widest text-on-surface-variant ml-4">Phone Number</label>
                            <input 
                              type="tel" 
                              required
                              value={newUser.phoneNumber}
                              onChange={(e) => setNewUser({ ...newUser, phoneNumber: e.target.value })}
                              className="w-full h-14 bg-surface-container-lowest rounded-2xl px-6 font-headline font-bold outline-none focus:ring-2 ring-primary"
                            />
                          </div>
                          <div className="space-y-2">
                            <label className="text-[10px] font-black uppercase tracking-widest text-on-surface-variant ml-4">Email Address</label>
                            <input 
                              type="email" 
                              required
                              value={newUser.email}
                              onChange={(e) => setNewUser({ ...newUser, email: e.target.value })}
                              className="w-full h-14 bg-surface-container-lowest rounded-2xl px-6 font-headline font-bold outline-none focus:ring-2 ring-primary"
                            />
                          </div>
                          <div className="space-y-2">
                            <label className="text-[10px] font-black uppercase tracking-widest text-on-surface-variant ml-4">Password</label>
                            <div className="relative">
                              <input 
                                type={showNewUserPassword ? "text" : "password"} 
                                required
                                value={newUser.password}
                                onChange={(e) => setNewUser({ ...newUser, password: e.target.value })}
                                className="w-full h-14 bg-surface-container-lowest rounded-2xl px-6 pr-14 font-headline font-bold outline-none focus:ring-2 ring-primary"
                              />
                              <button 
                                type="button"
                                onClick={() => setShowNewUserPassword(!showNewUserPassword)}
                                className="absolute right-4 top-1/2 -translate-y-1/2 text-on-surface-variant"
                              >
                                {showNewUserPassword ? (
                                  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M9.88 9.88L4.62 4.62"/><path d="M1 1l22 22"/><path d="M10.47 4.38A12.5 12.5 0 0 1 23 12a12.5 12.5 0 0 1-2.47 3.62"/><path d="M13.02 19.44A12.5 12.5 0 0 1 1 12a12.5 12.5 0 0 1 5.02-6.44"/><circle cx="12" cy="12" r="3"/><path d="M14.22 14.22a3 3 0 1 1-4.24-4.24"/></svg>
                                ) : (
                                  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>
                                )}
                              </button>
                            </div>
                          </div>
                        </>
                        
                        <div className="space-y-2">
                          <label className="text-[10px] font-black uppercase tracking-widest text-on-surface-variant ml-4">Role</label>
                          <select 
                            value={newUser.role}
                            onChange={(e) => setNewUser({ ...newUser, role: e.target.value as any })}
                            className="w-full h-14 bg-surface-container-lowest rounded-2xl px-6 font-headline font-bold outline-none focus:ring-2 ring-primary"
                          >
                            <option value="customer">Customer</option>
                            <option value="vendor">Vendor</option>
                            <option value="rider">Rider</option>
                            {hasFullAdminPrivileges && <option value="admin">Moderator Admin</option>}
                            {hasFullAdminPrivileges && <option value="super-sub-admin">Super Admin (Sub)</option>}
                          </select>
                        </div>
                        <div className="flex gap-4 pt-4">
                          <button 
                            type="button"
                            onClick={() => setIsAddUserModalOpen(false)}
                            className="flex-1 h-14 bg-surface-container-highest text-on-surface rounded-2xl font-headline font-black text-sm active:scale-95 transition-transform"
                          >
                            CANCEL
                          </button>
                          <button 
                            type="submit"
                            className="flex-1 h-14 bg-primary text-on-primary rounded-2xl font-headline font-black text-sm active:scale-95 transition-transform"
                          >
                            CREATE USER
                          </button>
                        </div>
                      </form>
                    )}
                  </motion.div>
                </div>
              )}

              {/* User Edit Modal */}
              {isUserModalOpen && editingUser && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-6">
                  <motion.div 
                    initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                    className="absolute inset-0 bg-surface/80 backdrop-blur-xl"
                    onClick={() => setIsUserModalOpen(false)}
                  />
                  <motion.div 
                    initial={{ opacity: 0, scale: 0.9, y: 20 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    className="relative w-full max-w-lg bg-surface-container-low rounded-[3rem] p-10 border border-primary/10 shadow-2xl"
                  >
                    <h2 className="text-3xl font-headline font-black text-on-surface mb-8 tracking-tighter">Edit User</h2>
                    <form onSubmit={handleSaveUser} className="space-y-6">
                      <div className="space-y-2">
                        <label className="text-[10px] font-black uppercase tracking-widest text-on-surface-variant ml-4">Full Name</label>
                        <input 
                          type="text" 
                          value={editingUser.fullName}
                          onChange={(e) => setEditingUser({ ...editingUser, fullName: e.target.value })}
                          className="w-full h-14 bg-surface-container-lowest rounded-2xl px-6 font-headline font-bold outline-none focus:ring-2 ring-primary"
                        />
                      </div>
                      <div className="space-y-2">
                        <label className="text-[10px] font-black uppercase tracking-widest text-on-surface-variant ml-4">Role</label>
                        <select 
                          value={editingUser.role}
                          onChange={(e) => setEditingUser({ ...editingUser, role: e.target.value })}
                          className="w-full h-14 bg-surface-container-lowest rounded-2xl px-6 font-headline font-bold outline-none focus:ring-2 ring-primary"
                        >
                          <option value="customer">Customer</option>
                          <option value="vendor">Vendor</option>
                          <option value="rider">Rider</option>
                          <option value="marketing">Marketing</option>
                          <option value="admin">Moderator Admin</option>
                          {hasFullAdminPrivileges && <option value="super-sub-admin">Super Admin (Sub)</option>}
                        </select>
                      </div>
                      <div className="space-y-2">
                        <label className="text-[10px] font-black uppercase tracking-widest text-on-surface-variant ml-4">Trust Points</label>
                        <input 
                          type="number" 
                          value={editingUser.trustPoints || 0}
                          onChange={(e) => setEditingUser({ ...editingUser, trustPoints: parseInt(e.target.value) || 0 })}
                          className="w-full h-14 bg-surface-container-lowest rounded-2xl px-6 font-headline font-bold outline-none focus:ring-2 ring-primary"
                        />
                      </div>
                      <div className="flex gap-4 pt-4">
                        <button 
                          type="button"
                          onClick={() => setIsUserModalOpen(false)}
                          className="flex-1 h-14 bg-surface-container-highest text-on-surface rounded-2xl font-headline font-black text-sm active:scale-95 transition-transform"
                        >
                          CANCEL
                        </button>
                        <button 
                          type="submit"
                          className="flex-1 h-14 signature-gradient text-white rounded-2xl font-headline font-black text-sm shadow-lg active:scale-95 transition-transform"
                        >
                          SAVE CHANGES
                        </button>
                      </div>
                    </form>
                  </motion.div>
                </div>
              )}

              {/* Verification Modal */}
              {isVerificationModalOpen && verifyingUser && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-6">
                  <motion.div 
                    initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                    className="absolute inset-0 bg-surface/80 backdrop-blur-xl"
                    onClick={() => setIsVerificationModalOpen(false)}
                  />
                  <motion.div 
                    initial={{ opacity: 0, scale: 0.9, y: 20 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    className="relative w-full max-w-2xl bg-surface-container-low rounded-[3rem] p-10 border border-primary/10 shadow-2xl overflow-y-auto max-h-[90vh]"
                  >
                    <div className="flex justify-between items-start mb-8">
                      <div>
                        <h2 className="text-3xl font-headline font-black text-on-surface tracking-tighter">Verification Details</h2>
                        <p className="text-on-surface-variant font-medium">Review credentials for {verifyingUser.fullName}</p>
                      </div>
                      <button 
                        onClick={() => setIsVerificationModalOpen(false)}
                        className="w-12 h-12 bg-surface-container-highest rounded-full flex items-center justify-center"
                      >
                        <XIcon className="w-6 h-6" />
                      </button>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-10">
                      <div className="space-y-6">
                        <div className="bg-surface-container-lowest p-6 rounded-3xl border border-primary/5">
                          <p className="text-[10px] font-black uppercase tracking-widest text-primary mb-4">Identity Information</p>
                          <div className="space-y-4">
                            <div>
                              <p className="text-[10px] font-black uppercase tracking-widest text-on-surface-variant">Full Name</p>
                              <p className="font-headline font-bold">{verifyingUser.fullName}</p>
                            </div>
                            <div>
                              <p className="text-[10px] font-black uppercase tracking-widest text-on-surface-variant">Phone Number</p>
                              <p className="font-headline font-bold">{verifyingUser.phoneNumber}</p>
                            </div>
                            {verifyingUser.nin && (
                              <div>
                                <p className="text-[10px] font-black uppercase tracking-widest text-on-surface-variant">NIN Number</p>
                                <p className="font-headline font-bold">{verifyingUser.nin}</p>
                              </div>
                            )}
                          </div>
                        </div>

                        {verifyingUser.role === 'vendor' && (
                          <div className="bg-surface-container-lowest p-6 rounded-3xl border border-primary/5">
                            <p className="text-[10px] font-black uppercase tracking-widest text-primary mb-4">Shop Information</p>
                            <div className="space-y-4">
                              <div>
                                <p className="text-[10px] font-black uppercase tracking-widest text-on-surface-variant">Shop Name</p>
                                <p className="font-headline font-bold">{verifyingUser.shopName}</p>
                              </div>
                              <div>
                                <p className="text-[10px] font-black uppercase tracking-widest text-on-surface-variant">Location/Landmark</p>
                                <p className="font-headline font-bold">{verifyingUser.landmark}</p>
                              </div>
                            </div>
                          </div>
                        )}
                      </div>

                      <div className="space-y-6">
                        <div className="bg-surface-container-lowest p-6 rounded-3xl border border-primary/5">
                          <p className="text-[10px] font-black uppercase tracking-widest text-primary mb-4">Financial Details</p>
                          <div className="space-y-4">
                            <div>
                              <p className="text-[10px] font-black uppercase tracking-widest text-on-surface-variant">Bank Name</p>
                              <p className="font-headline font-bold">{verifyingUser.bankName || 'Not provided'}</p>
                            </div>
                            <div>
                              <p className="text-[10px] font-black uppercase tracking-widest text-on-surface-variant">Account Number</p>
                              <p className="font-headline font-bold">{verifyingUser.bankAccountNumber || 'Not provided'}</p>
                            </div>
                          </div>
                        </div>

                        <div className="bg-surface-container-lowest p-6 rounded-3xl border border-primary/5">
                          <p className="text-[10px] font-black uppercase tracking-widest text-primary mb-4">Verification Documents</p>
                          <div className="space-y-4">
                            {verifyingUser.ninImage && (
                              <div className="space-y-2">
                                <p className="text-[10px] font-black uppercase tracking-widest text-on-surface-variant ml-2">NIN Document</p>
                                <div className="aspect-video bg-surface-container-highest rounded-2xl relative overflow-hidden border-2 border-primary/10 group">
                                  <Image 
                                    src={verifyingUser.ninImage} 
                                    alt="NIN" 
                                    fill 
                                    className="object-cover group-hover:scale-110 transition-transform duration-500" 
                                    unoptimized 
                                  />
                                  <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                                    <button 
                                      onClick={() => window.open(verifyingUser.ninImage, '_blank')}
                                      className="bg-white/20 backdrop-blur-md text-white p-3 rounded-full hover:bg-white/40 transition-colors"
                                    >
                                      <ExternalLink className="w-6 h-6" />
                                    </button>
                                  </div>
                                </div>
                              </div>
                            )}
                            
                            {verifyingUser.shopImage && (
                              <div className="space-y-2">
                                <p className="text-[10px] font-black uppercase tracking-widest text-on-surface-variant ml-2">Shop/Storefront Photo</p>
                                <div className="aspect-video bg-surface-container-highest rounded-2xl relative overflow-hidden border-2 border-primary/10 group">
                                  <Image 
                                    src={verifyingUser.shopImage} 
                                    alt="Shop" 
                                    fill 
                                    className="object-cover group-hover:scale-110 transition-transform duration-500" 
                                    unoptimized 
                                  />
                                  <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                                    <button 
                                      onClick={() => window.open(verifyingUser.shopImage, '_blank')}
                                      className="bg-white/20 backdrop-blur-md text-white p-3 rounded-full hover:bg-white/40 transition-colors"
                                    >
                                      <ExternalLink className="w-6 h-6" />
                                    </button>
                                  </div>
                                </div>
                              </div>
                            )}

                            {!verifyingUser.ninImage && !verifyingUser.shopImage && (
                              <div className="aspect-video bg-surface-container-highest rounded-2xl flex items-center justify-center border-2 border-dashed border-primary/10">
                                <div className="text-center">
                                  <ShieldAlert className="w-10 h-10 text-error/40 mx-auto mb-2" />
                                  <p className="text-[10px] font-black uppercase tracking-widest text-on-surface-variant">No Documents Uploaded</p>
                                </div>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="flex gap-4">
                      <button 
                        onClick={() => {
                          handleApprove(verifyingUser.uid);
                          setIsVerificationModalOpen(false);
                        }}
                        className="flex-1 h-16 signature-gradient text-white rounded-2xl font-headline font-black text-sm shadow-lg active:scale-95 transition-transform flex items-center justify-center gap-3"
                      >
                        <Check className="w-6 h-6" /> APPROVE USER
                      </button>
                      <button 
                        onClick={() => setIsVerificationModalOpen(false)}
                        className="flex-1 h-16 bg-error/10 text-error rounded-2xl font-headline font-black text-sm active:scale-95 transition-transform flex items-center justify-center gap-3"
                      >
                        <XIcon className="w-6 h-6" /> REJECT APPLICATION
                      </button>
                    </div>
                  </motion.div>
                </div>
              )}

              {/* Generic Detail Modal */}
              {isDetailModalOpen && selectedDetail && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-6">
                  <motion.div 
                    initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                    className="absolute inset-0 bg-surface/80 backdrop-blur-xl"
                    onClick={() => setIsDetailModalOpen(false)}
                  />
                  <motion.div 
                    initial={{ opacity: 0, scale: 0.9, y: 20 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    className="relative w-full max-w-lg bg-surface-container-low rounded-[3rem] p-10 border border-primary/10 shadow-2xl overflow-y-auto max-h-[90vh]"
                  >
                    <div className="flex justify-between items-start mb-8">
                      <div>
                        <h2 className="text-3xl font-headline font-black text-on-surface tracking-tighter">{selectedDetail.type} Details</h2>
                        <p className="text-on-surface-variant font-medium">Detailed record information</p>
                      </div>
                      <button 
                        onClick={() => setIsDetailModalOpen(false)}
                        className="w-12 h-12 bg-surface-container-highest rounded-full flex items-center justify-center"
                      >
                        <XIcon className="w-6 h-6" />
                      </button>
                    </div>

                    <div className="space-y-6 mb-10">
                      {Object.entries(selectedDetail).map(([key, value]) => {
                        if (key === 'type' || key === 'id') return null;
                        return (
                          <div key={key} className="bg-surface-container-lowest p-4 rounded-2xl border border-primary/5">
                            <p className="text-[10px] font-black uppercase tracking-widest text-on-surface-variant mb-1">{key}</p>
                            <p className="font-headline font-bold break-all">
                              {typeof value === 'object' ? JSON.stringify(value) : String(value)}
                            </p>
                          </div>
                        );
                      })}
                    </div>

                    <div className="flex gap-4">
                      <button 
                        onClick={() => setIsDetailModalOpen(false)}
                        className="flex-1 h-14 bg-primary text-on-primary rounded-2xl font-headline font-black text-sm active:scale-95 transition-transform"
                      >
                        CLOSE
                      </button>
                      {selectedDetail.type === 'Audit Log' && (
                        <button 
                          onClick={() => {
                            setIsOverriding(true);
                            setOverrideData({ action: selectedDetail.action, reason: '' });
                          }}
                          className="flex-1 h-14 bg-surface-container-highest text-on-surface rounded-2xl font-headline font-black text-sm active:scale-95 transition-transform"
                        >
                          OVERRIDE
                        </button>
                      )}
                    </div>

                    {isOverriding && (
                      <motion.div 
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="mt-8 p-6 bg-surface-container-highest rounded-3xl border border-primary/10"
                      >
                        <h3 className="font-headline font-black text-lg mb-4">Override Action</h3>
                        <div className="space-y-4">
                          <input 
                            type="text" 
                            placeholder="New Action Name"
                            value={overrideData.action}
                            onChange={(e) => setOverrideData({ ...overrideData, action: e.target.value })}
                            className="w-full h-12 bg-surface-container-lowest rounded-xl px-4 font-bold text-sm outline-none border border-primary/5"
                          />
                          <textarea 
                            placeholder="Reason for override..."
                            value={overrideData.reason}
                            onChange={(e) => setOverrideData({ ...overrideData, reason: e.target.value })}
                            className="w-full h-24 bg-surface-container-lowest rounded-xl p-4 font-medium text-sm outline-none border border-primary/5 resize-none"
                          />
                          <div className="flex gap-2">
                            <button 
                              onClick={() => setIsOverriding(false)}
                              className="flex-1 h-12 bg-surface-container-low text-on-surface rounded-xl font-bold text-xs"
                            >
                              Cancel
                            </button>
                            <button 
                              onClick={async () => {
                                if (!overrideData.reason) return alert('Please provide a reason.');
                                try {
                                  const token = localStorage.getItem('qw_token');
                                  const resp = await fetch(`/api/audit-logs/${selectedDetail.id}`, {
                                    method: 'PATCH',
                                    headers: {
                                      'Authorization': `Bearer ${token}`,
                                      'Content-Type': 'application/json'
                                    },
                                    body: JSON.stringify({ 
                                      action: overrideData.action, 
                                      overrideReason: overrideData.reason, 
                                      overridenBy: currentUser?.phoneNumber 
                                    })
                                  });
                                  if (resp.ok) {
                                    const updated = await resp.json();
                                    setAuditLogs(prev => prev.map(l => l.id === selectedDetail.id ? updated : l));
                                    alert('Audit log updated successfully.');
                                    setIsOverriding(false);
                                    setIsDetailModalOpen(false);
                                  }
                                } catch (err) {
                                  alert('Failed to update audit log.');
                                }
                              }}
                              className="flex-1 h-12 bg-primary text-on-primary rounded-xl font-bold text-xs"
                            >
                              Confirm Override
                            </button>
                          </div>
                        </div>
                      </motion.div>
                    )}
                  </motion.div>
                </div>
              )}
              {/* Dispute Refund Modal */}
              {isRefundModalOpen && resolvingOrder && (
                <div className="fixed inset-0 z-[110] flex items-center justify-center p-6">
                  <motion.div 
                    initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                    className="absolute inset-0 bg-surface/80 backdrop-blur-xl"
                    onClick={() => setIsRefundModalOpen(false)}
                  />
                  <motion.div 
                    initial={{ opacity: 0, scale: 0.9, y: 20 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    className="relative w-full max-w-md bg-surface-container-low rounded-[3rem] p-10 border border-primary/10 shadow-2xl"
                  >
                    <h2 className="text-2xl font-headline font-black text-on-surface mb-2">Resolve Dispute</h2>
                    <p className="text-on-surface-variant text-sm font-medium mb-8">Order #{resolvingOrder.id} • Total: ₦{resolvingOrder.totalPrice.toLocaleString()}</p>
                    
                    <div className="space-y-6">
                      <div className="grid grid-cols-1 gap-3">
                        <button 
                          onClick={() => handleResolveDispute(resolvingOrder.id, 'refund')}
                          className="w-full h-16 bg-primary text-on-primary rounded-2xl font-headline font-black text-xs shadow-lg active:scale-95 transition-transform flex items-center justify-between px-6"
                        >
                          FULL REFUND
                          <span>₦{resolvingOrder.totalPrice.toLocaleString()}</span>
                        </button>
                        
                        <div className="space-y-3 p-6 bg-surface-container-lowest rounded-2xl border border-primary/10">
                          <p className="text-[10px] font-black uppercase tracking-widest text-on-surface-variant">PARTIAL REFUND</p>
                          <div className="flex items-center gap-3">
                            <span className="text-2xl font-headline font-black">₦</span>
                            <input 
                              type="number"
                              value={refundAmount}
                              onChange={(e) => setRefundAmount(Math.min(resolvingOrder.totalPrice, Number(e.target.value)))}
                              className="w-full h-12 bg-surface-container p-4 rounded-xl font-headline font-black text-xl outline-none focus:ring-2 ring-primary"
                            />
                          </div>
                          <button 
                            onClick={() => handleResolveDispute(resolvingOrder.id, 'partial', refundAmount)}
                            disabled={refundAmount <= 0 || refundAmount >= resolvingOrder.totalPrice}
                            className="w-full h-12 bg-surface-container-highest text-on-surface rounded-xl font-headline font-bold text-xs disabled:opacity-50"
                          >
                            CONFIRM PARTIAL
                          </button>
                        </div>

                        <button 
                          onClick={() => handleResolveDispute(resolvingOrder.id, 'reject')}
                          className="w-full h-14 bg-error text-on-error rounded-2xl font-headline font-black text-xs active:scale-95 transition-transform"
                        >
                          NO REFUND (REJECT)
                        </button>
                      </div>

                      <button 
                        onClick={() => setIsRefundModalOpen(false)}
                        className="w-full h-12 text-on-surface-variant font-headline font-bold text-xs"
                      >
                        CLOSE
                      </button>
                    </div>
                  </motion.div>
                </div>
              )}
              {/* Wallet History Modal */}
              {historyModal.open && (
                <div className="fixed inset-0 z-[110] flex items-center justify-center p-6">
                  <motion.div 
                    initial={{ opacity: 0 }} 
                    animate={{ opacity: 1 }}
                    className="absolute inset-0 bg-surface/80 backdrop-blur-xl"
                    onClick={() => setHistoryModal({ ...historyModal, open: false })}
                  />
                  <motion.div 
                    initial={{ opacity: 0, scale: 0.9, y: 20 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    className="relative w-full max-w-2xl bg-surface-container-low rounded-[3rem] p-10 border border-primary/10 shadow-2xl overflow-hidden flex flex-col max-h-[80vh]"
                  >
                    <div className="flex justify-between items-center mb-8">
                      <div>
                        <h2 className="text-3xl font-headline font-black text-on-surface tracking-tighter uppercase italic">
                          {historyModal.type === 'payout' ? 'Payouts' : 'Withdrawals'} History
                        </h2>
                        <p className="text-on-surface-variant font-medium text-sm">Archived log of platform {historyModal.type}s.</p>
                      </div>
                      <button 
                        onClick={() => setHistoryModal({ ...historyModal, open: false })}
                        className="w-12 h-12 rounded-2xl bg-surface-container-highest flex items-center justify-center text-on-surface active:scale-90 transition-transform"
                      >
                        <X className="w-6 h-6" />
                      </button>
                    </div>

                    <div className="flex-1 overflow-y-auto space-y-4 pr-4 custom-scrollbar">
                      {allTransactions
                        .filter(t => historyModal.type === 'payout' ? t.type === 'payout' : t.type === 'withdrawal')
                        .map((t) => (
                        <div key={t._id} className="p-6 bg-surface-container-lowest rounded-3xl border border-primary/5 flex justify-between items-center">
                          <div className="flex items-center gap-4">
                            <div className={cn("w-12 h-12 rounded-2xl flex items-center justify-center", historyModal.type === 'payout' ? "bg-primary/10 text-primary" : "bg-warning/10 text-warning")}>
                              <History className="w-6 h-6" />
                            </div>
                            <div>
                              <p className="font-headline font-bold text-lg">{t.desc}</p>
                              <p className="text-xs text-on-surface-variant">{new Date(t.date).toLocaleDateString()} • {new Date(t.date).toLocaleTimeString()}</p>
                              <p className="text-[10px] font-bold text-primary truncate max-w-[150px]">Ref: {t.reference || 'N/A'}</p>
                            </div>
                          </div>
                          <div className="text-right">
                            <p className="text-xl font-headline font-black">₦{t.amount.toLocaleString()}</p>
                            <span className={cn(
                              "text-[10px] font-black uppercase tracking-widest px-2 py-1 rounded-md",
                              t.status === 'completed' ? "text-success bg-success/10" : 
                              t.status === 'pending' ? "text-warning bg-warning/10" : "text-error bg-error/10"
                            )}>{t.status}</span>
                          </div>
                        </div>
                      ))}
                      {allTransactions.filter(t => historyModal.type === 'payout' ? t.type === 'payout' : t.type === 'withdrawal').length === 0 && (
                        <div className="text-center py-20 bg-surface-container-lowest rounded-3xl border border-dashed border-primary/20">
                          <p className="font-headline font-bold text-on-surface-variant">No {historyModal.type} history found.</p>
                        </div>
                      )}
                    </div>
                    
                    <div className="mt-8 pt-8 border-t border-primary/10 text-center">
                      <p className="text-[10px] font-black uppercase tracking-widest text-on-surface-variant">Showing latest records from database</p>
                    </div>
                  </motion.div>
                </div>
              )}
      </div>
      {/* Notifications */}
      <AnimatePresence>
        {notification && (
          <motion.div 
            initial={{ opacity: 0, y: 50, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 50, scale: 0.9 }}
            className={cn(
              "fixed bottom-8 left-1/2 -translate-x-1/2 z-[200] px-8 py-4 rounded-2xl font-headline font-black text-sm shadow-2xl flex items-center gap-3 min-w-[320px]",
              notification.type === 'success' ? "bg-success text-white" :
              notification.type === 'error' ? "bg-error text-white" :
              "bg-primary text-white"
            )}
          >
            {notification.type === 'success' ? <CheckCircle className="w-5 h-5" /> : 
             notification.type === 'error' ? <ShieldAlert className="w-5 h-5" /> : 
             <Zap className="w-5 h-5" />}
            {notification.message}
            <button onClick={() => setNotification(null)} className="ml-auto opacity-70 hover:opacity-100">
              <XIcon className="w-4 h-4" />
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
