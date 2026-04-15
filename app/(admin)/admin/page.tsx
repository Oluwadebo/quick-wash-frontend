'use client';

import React from 'react';
import TopAppBar from '@/components/shared/TopAppBar';
import { 
  Users, ShoppingBag, TrendingUp, AlertTriangle, ShieldCheck, 
  Map, Activity, ArrowUpRight, Check, X as XIcon, 
  Wallet, BarChart3, Megaphone, History, MessageSquare, 
  Search, Filter, MoreHorizontal, UserPlus, Trash2, ExternalLink,
  Edit3, Bike, Package, Navigation
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { cn } from '@/lib/utils';
import { useAuth } from '@/hooks/use-auth';
import ProtectedRoute from '@/components/shared/ProtectedRoute';
import Image from 'next/image';
import { useSearchParams } from 'next/navigation';

import { 
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  AreaChart, Area, BarChart, Bar, PieChart, Pie, Cell
} from 'recharts';

type AdminTab = 'overview' | 'orders' | 'disputes' | 'users' | 'wallets' | 'analytics' | 'marketing' | 'audit';
type UserSection = 'all' | 'admin' | 'vendor' | 'rider' | 'customer' | 'marketing';

export default function AdminDashboard() {
  const searchParams = useSearchParams();
  const tabParam = searchParams.get('tab') as AdminTab;
  const { approveUser, user: currentUser } = useAuth();
  const [activeTab, setActiveTab] = React.useState<AdminTab>('overview');

  React.useEffect(() => {
    if (tabParam) {
      setActiveTab(tabParam);
    }
  }, [tabParam]);
  const [userSection, setUserSection] = React.useState<UserSection>('all');
  const [pendingUsers, setPendingUsers] = React.useState<any[]>([]);
  const [allUsers, setAllUsers] = React.useState<any[]>([]);
  const [orders, setOrders] = React.useState<any[]>([]);
  const [alerts, setAlerts] = React.useState<any[]>([]);
  const [stats, setStats] = React.useState<any[]>([]);

  const [isUserModalOpen, setIsUserModalOpen] = React.useState(false);
  const [isAddUserModalOpen, setIsAddUserModalOpen] = React.useState(false);
  const [editingUser, setEditingUser] = React.useState<any>(null);
  const [newUser, setNewUser] = React.useState<any>({
    fullName: '',
    phoneNumber: '',
    password: '',
    role: 'customer',
    status: 'active',
    isApproved: true
  });

  const isSuperAdmin = currentUser?.phoneNumber === '09012345678';

  const handleRestrictUser = (phone: string, status: 'active' | 'restricted' | 'suspended') => {
    if (!isSuperAdmin) {
      alert('Only Super Admin can restrict or ban users.');
      return;
    }
    const users = JSON.parse(localStorage.getItem('qw_all_users') || '[]');
    const updated = users.map((u: any) => u.phoneNumber === phone ? { ...u, status } : u);
    localStorage.setItem('qw_all_users', JSON.stringify(updated));
    setAllUsers(updated);
    alert(`User status updated to ${status}.`);
  };

  const handleAddUser = (e: React.FormEvent) => {
    e.preventDefault();
    const users = JSON.parse(localStorage.getItem('qw_all_users') || '[]');
    if (users.find((u: any) => u.phoneNumber === newUser.phoneNumber)) {
      alert('User with this phone number already exists!');
      return;
    }
    const updated = [...users, { ...newUser, trustPoints: 50, trustScore: 100, walletBalance: 0, pendingBalance: 0 }];
    localStorage.setItem('qw_all_users', JSON.stringify(updated));
    setAllUsers(updated);
    setIsAddUserModalOpen(false);
    setNewUser({ fullName: '', phoneNumber: '', password: '', role: 'customer', status: 'active', isApproved: true });
    
    // Add audit log
    const logs = JSON.parse(localStorage.getItem('qw_audit_logs') || '[]');
    logs.push({
      id: Date.now(),
      action: 'User Created',
      target: newUser.phoneNumber,
      admin: currentUser?.phoneNumber,
      time: new Date().toISOString(),
      details: `Admin ${currentUser?.fullName} created a new ${newUser.role}: ${newUser.fullName}`
    });
    localStorage.setItem('qw_audit_logs', JSON.stringify(logs));
    
    alert(`User ${newUser.fullName} created successfully! Details: Phone: ${newUser.phoneNumber}, Role: ${newUser.role}`);
  };
  const [isVerificationModalOpen, setIsVerificationModalOpen] = React.useState(false);
  const [verifyingUser, setVerifyingUser] = React.useState<any>(null);
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

  const handleAddCampaign = React.useCallback((e: React.FormEvent) => {
    e.preventDefault();
    const updated = editingCampaign 
      ? campaigns.map(c => c.id === editingCampaign.id ? { ...campaignForm, id: c.id } : c)
      : [...campaigns, { ...campaignForm, id: Date.now() }];
    
    localStorage.setItem('qw_campaigns', JSON.stringify(updated));
    setCampaigns(updated);
    setIsCampaignModalOpen(false);
    setEditingCampaign(null);
    setCampaignForm({ name: '', status: 'Active', reach: '0', conversion: '0%', color: 'bg-primary' });
    
    // Audit Log
    const logs = JSON.parse(localStorage.getItem('qw_audit_logs') || '[]');
    logs.push({
      id: Date.now(),
      action: editingCampaign ? 'Campaign Updated' : 'Campaign Created',
      target: campaignForm.name,
      admin: currentUser?.phoneNumber,
      time: new Date().toISOString(),
      details: `Admin ${currentUser?.fullName} ${editingCampaign ? 'updated' : 'created'} campaign: ${campaignForm.name}`
    });
    localStorage.setItem('qw_audit_logs', JSON.stringify(logs));
  }, [campaigns, editingCampaign, campaignForm, currentUser]);

  const handleDeleteCampaign = React.useCallback((id: number) => {
    const updated = campaigns.filter(c => c.id !== id);
    localStorage.setItem('qw_campaigns', JSON.stringify(updated));
    setCampaigns(updated);
    
    // Audit Log
    const logs = JSON.parse(localStorage.getItem('qw_audit_logs') || '[]');
    logs.push({
      id: Date.now(),
      action: 'Campaign Deleted',
      target: id.toString(),
      admin: currentUser?.phoneNumber,
      time: new Date().toISOString()
    });
    localStorage.setItem('qw_audit_logs', JSON.stringify(logs));
    setCampaignToDelete(null);
  }, [campaigns, currentUser]);

  const clearAlerts = () => {
    localStorage.setItem('qw_alerts', JSON.stringify([]));
    setAlerts([]);
    alert('System alerts cleared.');
  };

  const handleEditUser = (user: any) => {
    setEditingUser(user);
    setIsUserModalOpen(true);
  };

  const handleDeleteUser = (phone: string) => {
    if (confirm('Are you sure you want to delete this user?')) {
      const users = JSON.parse(localStorage.getItem('qw_all_users') || '[]');
      const updated = users.filter((u: any) => u.phoneNumber !== phone);
      localStorage.setItem('qw_all_users', JSON.stringify(updated));
      setAllUsers(updated);
      setPendingUsers(updated.filter((u: any) => !u.isApproved));
    }
  };

  const handleSaveUser = (e: React.FormEvent) => {
    e.preventDefault();
    const users = JSON.parse(localStorage.getItem('qw_all_users') || '[]');
    const updated = users.map((u: any) => u.phoneNumber === editingUser.phoneNumber ? editingUser : u);
    localStorage.setItem('qw_all_users', JSON.stringify(updated));
    setAllUsers(updated);
    setIsUserModalOpen(false);
    alert('User updated successfully!');
  };
  const [riders, setRiders] = React.useState<any[]>([]);

  React.useEffect(() => {
    const users = JSON.parse(localStorage.getItem('qw_all_users') || '[]');
    setAllUsers(users);
    setPendingUsers(users.filter((u: any) => !u.isApproved));
    setRiders(users.filter((u: any) => u.role === 'rider' && u.isApproved));

    const storedAlerts = JSON.parse(localStorage.getItem('qw_alerts') || '[]');
    setAlerts(storedAlerts.sort((a: any, b: any) => b.id - a.id));

    const allOrders = JSON.parse(localStorage.getItem('qw_orders') || '[]');
    setOrders(allOrders);

    const totalRevenue = allOrders.reduce((acc: number, o: any) => acc + (o.totalPrice || 0), 0);
    const activeOrders = allOrders.filter((o: any) => o.status !== 'Delivered' && !o.status.includes('Cancelled')).length;
    
    setStats([
      { label: 'Total Revenue', value: `₦${(totalRevenue || 0).toLocaleString()}`, trend: '+18.2%', icon: TrendingUp, color: 'text-primary' },
      { label: 'Active Orders', value: activeOrders.toString(), trend: '+5.4%', icon: ShoppingBag, color: 'text-tertiary' },
      { label: 'Total Users', value: users.length.toString(), trend: '+12.1%', icon: Users, color: 'text-on-surface' },
      { label: 'System Health', value: '99.9%', trend: 'Stable', icon: Activity, color: 'text-primary' }
    ]);

    const storedCampaigns = JSON.parse(localStorage.getItem('qw_campaigns') || '[]');
    if (storedCampaigns.length === 0) {
      const defaultCampaigns = [
        { id: 1, name: 'Freshman Welcome', status: 'Active', reach: '1.2k', conversion: '15%', color: 'bg-primary' },
        { id: 2, name: 'Weekend Flash Sale', status: 'Scheduled', reach: '4.5k', conversion: '-', color: 'bg-tertiary' },
        { id: 3, name: 'Loyalty Rewards', status: 'Active', reach: '850', conversion: '22%', color: 'bg-success' }
      ];
      localStorage.setItem('qw_campaigns', JSON.stringify(defaultCampaigns));
      setCampaigns(defaultCampaigns);
    } else {
      setCampaigns(storedCampaigns);
    }
  }, []);

  const assignRider = (orderId: string, riderPhone: string) => {
    const allOrders = JSON.parse(localStorage.getItem('qw_orders') || '[]');
    const updated = allOrders.map((o: any) => {
      if (o.id === orderId) {
        return { ...o, riderPhone, status: o.status === 'Pending Pickup' ? 'Pending Pickup' : o.status };
      }
      return o;
    });
    localStorage.setItem('qw_orders', JSON.stringify(updated));
    setOrders(updated);
    alert('Rider assigned successfully!');
  };

  const handleApprove = React.useCallback((phone: string) => {
    const updated = approveUser(phone);
    setAllUsers(updated);
    setPendingUsers(updated.filter((u: any) => !u.isApproved));
    
    // Add audit log
    const logs = JSON.parse(localStorage.getItem('qw_audit_logs') || '[]');
    const newLog = {
      id: Date.now(),
      action: 'User Approved',
      target: phone,
      admin: currentUser?.phoneNumber,
      time: new Date().toISOString()
    };
    logs.push(newLog);
    localStorage.setItem('qw_audit_logs', JSON.stringify(logs));
    
    alert('User approved successfully!');
  }, [approveUser, currentUser]);

  const tabs: { id: AdminTab; label: string; icon: any }[] = [
    { id: 'overview', label: 'Overview', icon: Activity },
    { id: 'orders', label: 'Orders', icon: ShoppingBag },
    { id: 'disputes', label: 'Disputes', icon: AlertTriangle },
    { id: 'users', label: 'Users', icon: Users },
    { id: 'wallets', label: 'Wallets', icon: Wallet },
    { id: 'analytics', label: 'Analytics', icon: BarChart3 },
    { id: 'marketing', label: 'Marketing', icon: Megaphone },
    { id: 'audit', label: 'Audit Log', icon: History },
  ];

  return (
    <div className="pb-32 bg-surface">
      <TopAppBar roleLabel={currentUser?.phoneNumber === '09012345678' ? 'Super Admin' : 'Moderator Admin'} />
      
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
                                onClick={() => handleApprove(u.phoneNumber)}
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
                        <h2 className="text-2xl font-headline font-black text-on-surface">System Alerts</h2>
                        <button 
                          onClick={clearAlerts}
                          className="text-[10px] font-black uppercase tracking-widest text-primary hover:underline"
                        >
                          Clear All
                        </button>
                      </div>
                      <div className="space-y-4">
                        {alerts.slice(0, 4).map(alert => (
                          <div key={alert.id} className="flex gap-4 p-4 bg-surface-container-lowest rounded-2xl border border-primary/5">
                            <div className={cn("w-10 h-10 rounded-xl flex items-center justify-center shrink-0", alert.color)}>
                              <AlertTriangle className="w-5 h-5" />
                            </div>
                            <div>
                              <p className="text-xs font-black uppercase tracking-widest text-on-surface mb-1">{alert.type}</p>
                              <p className="text-[10px] font-medium text-on-surface-variant line-clamp-2">{alert.msg}</p>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
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
                            // Moderator restrictions: hide admins and super admin
                            if (!isSuperAdmin) {
                              if (u.role === 'admin') return false;
                              if (u.phoneNumber === '09012345678') return false;
                            }
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
                                <button 
                                  onClick={() => handleEditUser(u)}
                                  className="p-2 rounded-lg bg-surface-container-highest text-on-surface-variant hover:text-primary transition-colors"
                                  title="Edit User"
                                >
                                  <Edit3 className="w-4 h-4" />
                                </button>
                                {isSuperAdmin && (
                                  <>
                                    <button 
                                      onClick={() => handleRestrictUser(u.phoneNumber, u.status === 'restricted' ? 'active' : 'restricted')}
                                      className={cn(
                                        "p-2 rounded-lg bg-surface-container-highest transition-colors",
                                        u.status === 'restricted' ? "text-success hover:bg-success/10" : "text-warning hover:bg-warning/10"
                                      )}
                                      title={u.status === 'restricted' ? "Unrestrict User" : "Restrict User"}
                                    >
                                      <ShieldCheck className="w-4 h-4" />
                                    </button>
                                    <button 
                                      onClick={() => handleRestrictUser(u.phoneNumber, u.status === 'suspended' ? 'active' : 'suspended')}
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
                                <button 
                                  onClick={() => handleDeleteUser(u.phoneNumber)}
                                  className="p-2 rounded-lg bg-surface-container-highest text-on-surface-variant hover:text-error transition-colors"
                                  title="Delete User"
                                >
                                  <Trash2 className="w-4 h-4" />
                                </button>
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
                    {(JSON.parse(localStorage.getItem('qw_audit_logs') || '[]')).reverse().map((log: any) => (
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
                    {(JSON.parse(localStorage.getItem('qw_audit_logs') || '[]')).length === 0 && (
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
                    <div className="bg-primary text-on-primary p-8 rounded-[2.5rem] shadow-xl">
                      <p className="font-label text-[10px] font-black uppercase tracking-widest opacity-80 mb-2">Platform Commission</p>
                      <h3 className="text-4xl font-headline font-black">₦{allUsers.find(u => u.phoneNumber === '09012345678')?.walletBalance?.toLocaleString() || '0'}</h3>
                    </div>
                    <div className="bg-surface-container-low p-8 rounded-[2.5rem] border border-primary/5">
                      <p className="font-label text-[10px] font-black uppercase tracking-widest text-on-surface-variant mb-2">Total Payouts</p>
                      <h3 className="text-4xl font-headline font-black text-on-surface">₦450,000</h3>
                    </div>
                    <div className="bg-surface-container-low p-8 rounded-[2.5rem] border border-primary/5">
                      <p className="font-label text-[10px] font-black uppercase tracking-widest text-on-surface-variant mb-2">Pending Withdrawals</p>
                      <h3 className="text-4xl font-headline font-black text-warning">₦12,500</h3>
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
                      {orders.filter(o => o.disputed).map(o => (
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
                          <p className="text-sm text-on-surface-variant mb-6 bg-surface-container p-4 rounded-xl italic">
                            &quot;{o.disputeReason || 'Customer reported items missing from bag.'}&quot;
                          </p>
                          <div className="flex gap-3">
                            <button className="flex-1 h-12 bg-primary text-on-primary rounded-xl font-headline font-bold text-xs active:scale-95 transition-transform">
                              Refund Customer
                            </button>
                            <button className="flex-1 h-12 bg-surface-container-highest text-on-surface rounded-xl font-headline font-bold text-xs active:scale-95 transition-transform">
                              Reject Dispute
                            </button>
                          </div>
                        </div>
                      ))}
                      {orders.filter(o => o.disputed).length === 0 && (
                        <div className="py-20 text-center border-2 border-dashed border-primary/10 rounded-3xl">
                          <p className="text-on-surface-variant font-medium">No active disputes. Great job!</p>
                        </div>
                      )}
                    </div>
                  </div>
                </motion.div>
              )}

              {activeTab === 'analytics' && (
                <motion.div 
                  key="analytics"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="space-y-8"
                >
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                    <div className="bg-surface-container-low p-8 rounded-[2.5rem] border border-primary/5">
                      <h3 className="text-xl font-headline font-black mb-6">Revenue Growth</h3>
                      <div className="h-80 w-full">
                        <ResponsiveContainer width="100%" height="100%">
                          <AreaChart data={[
                            { name: 'Mon', value: 4000 },
                            { name: 'Tue', value: 3000 },
                            { name: 'Wed', value: 5000 },
                            { name: 'Thu', value: 2780 },
                            { name: 'Fri', value: 1890 },
                            { name: 'Sat', value: 2390 },
                            { name: 'Sun', value: 3490 },
                          ]}>
                            <defs>
                              <linearGradient id="colorValue" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="5%" stopColor="#6750A4" stopOpacity={0.3}/>
                                <stop offset="95%" stopColor="#6750A4" stopOpacity={0}/>
                              </linearGradient>
                            </defs>
                            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E1E2EC" />
                            <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 10, fontWeight: 700 }} />
                            <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 10, fontWeight: 700 }} />
                            <Tooltip 
                              contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
                            />
                            <Area type="monotone" dataKey="value" stroke="#6750A4" strokeWidth={3} fillOpacity={1} fill="url(#colorValue)" />
                          </AreaChart>
                        </ResponsiveContainer>
                      </div>
                    </div>

                    <div className="bg-surface-container-low p-8 rounded-[2.5rem] border border-primary/5">
                      <h3 className="text-xl font-headline font-black mb-6">Order Categories</h3>
                      <div className="h-80 w-full">
                        <ResponsiveContainer width="100%" height="100%">
                          <BarChart data={[
                            { name: 'Wash', value: 450 },
                            { name: 'Iron', value: 300 },
                            { name: 'Wash+Iron', value: 600 },
                            { name: 'Premium', value: 150 },
                          ]}>
                            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E1E2EC" />
                            <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 10, fontWeight: 700 }} />
                            <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 10, fontWeight: 700 }} />
                            <Tooltip 
                              contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
                            />
                            <Bar dataKey="value" fill="#6750A4" radius={[8, 8, 0, 0]} />
                          </BarChart>
                        </ResponsiveContainer>
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    {[
                      { label: 'Avg. Order Value', value: '₦3,450', trend: '+12%' },
                      { label: 'Customer Retention', value: '78%', trend: '+5%' },
                      { label: 'Rider Efficiency', value: '94%', trend: '+2%' }
                    ].map(m => (
                      <div key={m.label} className="bg-surface-container-low p-6 rounded-3xl border border-primary/5">
                        <p className="text-[10px] font-black uppercase tracking-widest text-on-surface-variant mb-1">{m.label}</p>
                        <div className="flex justify-between items-end">
                          <h4 className="text-2xl font-headline font-black">{m.value}</h4>
                          <span className="text-xs font-bold text-success">{m.trend}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </motion.div>
              )}

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
                    <h2 className="text-3xl font-headline font-black text-on-surface mb-8 tracking-tighter">Add New User</h2>
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
                      <div className="space-y-2">
                        <label className="text-[10px] font-black uppercase tracking-widest text-on-surface-variant ml-4">Role</label>
                        <select 
                          value={newUser.role}
                          onChange={(e) => setNewUser({ ...newUser, role: e.target.value })}
                          className="w-full h-14 bg-surface-container-lowest rounded-2xl px-6 font-headline font-bold outline-none focus:ring-2 ring-primary"
                        >
                          <option value="customer">Customer</option>
                          <option value="vendor">Vendor</option>
                          <option value="rider">Rider</option>
                          {isSuperAdmin && <option value="admin">Admin</option>}
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
                          className="flex-1 h-14 signature-gradient text-white rounded-2xl font-headline font-black text-sm shadow-lg active:scale-95 transition-transform"
                        >
                          CREATE USER
                        </button>
                      </div>
                    </form>
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
                          <option value="admin">Admin</option>
                        </select>
                      </div>
                      <div className="space-y-2">
                        <label className="text-[10px] font-black uppercase tracking-widest text-on-surface-variant ml-4">Trust Points</label>
                        <input 
                          type="number" 
                          value={editingUser.trustPoints || 0}
                          onChange={(e) => setEditingUser({ ...editingUser, trustPoints: parseInt(e.target.value) })}
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
                          <div className="aspect-video bg-surface-container-highest rounded-2xl flex items-center justify-center border-2 border-dashed border-primary/10">
                            <div className="text-center">
                              <ShieldCheck className="w-10 h-10 text-primary/40 mx-auto mb-2" />
                              <p className="text-[10px] font-black uppercase tracking-widest text-on-surface-variant">ID Document Preview</p>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="flex gap-4">
                      <button 
                        onClick={() => {
                          handleApprove(verifyingUser.phoneNumber);
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
                              onClick={() => {
                                if (!overrideData.reason) return alert('Please provide a reason.');
                                const logs = JSON.parse(localStorage.getItem('qw_audit_logs') || '[]');
                                const updated = logs.map((l: any) => l.id === selectedDetail.id ? { ...l, action: overrideData.action, overrideReason: overrideData.reason, overridenBy: currentUser?.phoneNumber } : l);
                                localStorage.setItem('qw_audit_logs', JSON.stringify(updated));
                                alert('Audit log updated successfully.');
                                setIsOverriding(false);
                                setIsDetailModalOpen(false);
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
            </AnimatePresence>
      </div>
    </div>
  );
}
