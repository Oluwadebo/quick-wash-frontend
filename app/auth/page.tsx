'use client';

import React, { useState, Suspense } from 'react';
import Image from 'next/image';
import { useSearchParams, useRouter } from 'next/navigation';
import { useAuth, UserRole } from '@/hooks/use-auth';
import { Droplets, ArrowLeft, Phone, Lock, User, MapPin, ChevronRight, Sparkles, Store, Bike, Eye, EyeOff, Mail, Github, Globe } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { cn } from '@/lib/utils';
import { db, SiteSettings } from '@/lib/DatabaseService';

function AuthContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const { signup, login, isProcessing, error } = useAuth();
  
  const role = (searchParams.get('role') as UserRole) || 'customer';
  const initialIsLogin = searchParams.get('login') === 'true';
  const message = searchParams.get('message');
  const [isLogin, setIsLogin] = useState(initialIsLogin);
  const [authMode, setAuthMode] = useState<'auth' | 'forgot' | 'reset'>('auth');
  const [settings, setSettings] = useState<SiteSettings | null>(null);

  // Load site settings
  React.useEffect(() => {
    db.getSiteSettings().then(setSettings);
  }, []);

  // Keep state in sync with URL
  React.useEffect(() => {
    setIsLogin(searchParams.get('login') === 'true');
  }, [searchParams]);
  const [resetData, setResetData] = useState({ identifier: '', code: '', newPassword: '' });
  const [resetMessage, setResetMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);
  
  const [showPassword, setShowPassword] = useState(false);
  
  const [formData, setFormData] = useState({
    email: '',
    fullName: '',
    phoneNumber: '',
    password: '',
    landmark: 'Under-G',
    shopName: '',
    shopAddress: '',
    vehicleType: 'Bicycle',
    nin: '',
    ninImage: null as string | null,
    shopImage: null as string | null,
    address: '',
    whatsappNumber: '',
    bankAccountName: '',
    bankAccountNumber: '',
    bankName: '',
    turnaroundTime: '24hr',
    capacity: 10
  });

  const handleImageUpload = (field: 'ninImage' | 'shopImage') => (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        alert('File is too large! Maximum 5MB.');
        return;
      }
      const reader = new FileReader();
      reader.onloadend = () => {
        setFormData(prev => ({ ...prev, [field]: reader.result as string }));
      };
      reader.readAsDataURL(file);
    }
  };

  const handleForgotPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setResetMessage(null);
    try {
      const res = await fetch('/api/auth/forgot-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ identifier: resetData.identifier })
      });
      const data = await res.json();
      if (res.ok) {
        setResetMessage({ type: 'success', text: data.message + (data.demoCode ? ` (Demo Code: ${data.demoCode})` : '') });
        setAuthMode('reset');
      } else {
        setResetMessage({ type: 'error', text: data.message });
      }
    } catch (err: any) {
      setResetMessage({ type: 'error', text: 'Something went wrong.' });
    }
  };

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setResetMessage(null);
    try {
      const res = await fetch('/api/auth/reset-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(resetData)
      });
      const data = await res.json();
      if (res.ok) {
        setResetMessage({ type: 'success', text: 'Password reset successful! You can now login.' });
        setAuthMode('auth');
        setIsLogin(true);
      } else {
        setResetMessage({ type: 'error', text: data.message });
      }
    } catch (err: any) {
      setResetMessage({ type: 'error', text: 'Something went wrong.' });
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (isLogin) {
      login(formData.phoneNumber, formData.password);
    } else {
      signup({
        email: formData.email,
        fullName: formData.fullName,
        phoneNumber: formData.phoneNumber,
        password: formData.password,
        landmark: (role === 'customer' || role === 'rider') ? formData.landmark : undefined,
        role: role,
        shopName: role === 'vendor' ? formData.shopName : undefined,
        shopAddress: role === 'vendor' ? formData.shopAddress : undefined,
        vehicleType: role === 'rider' ? formData.vehicleType : undefined,
        nin: role === 'rider' ? formData.nin : undefined,
        ninImage: role === 'rider' ? (formData.ninImage || undefined) : undefined,
        shopImage: role === 'vendor' ? (formData.shopImage || undefined) : undefined,
        address: role === 'rider' ? formData.address : undefined,
        whatsappNumber: role === 'vendor' ? formData.whatsappNumber : undefined,
        bankAccountName: (role === 'vendor' || role === 'rider') ? formData.bankAccountName : undefined,
        bankAccountNumber: (role === 'vendor' || role === 'rider') ? formData.bankAccountNumber : undefined,
        bankName: (role === 'vendor' || role === 'rider') ? formData.bankName : undefined,
        turnaroundTime: role === 'vendor' ? formData.turnaroundTime : undefined,
        capacity: role === 'vendor' ? Number(formData.capacity) : undefined
      } as any);
    }
  };

  return (
    <div className="min-h-screen bg-surface flex flex-col relative overflow-hidden">
      {/* Dynamic Background */}
      <div className="absolute inset-0 z-0 opacity-[0.03] pointer-events-none">
        <div 
          className="absolute inset-0"
          style={{ 
            backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M30 30c0-16.569 13.431-30 30-30v60c-16.569 0-30-13.431-30-30zM0 30c0 16.569 13.431 30 30 30V0C13.431 0 0 13.431 0 30z' fill='%231a56db' fill-opacity='0.4' fill-rule='evenodd'/%3E%3C/svg%3E")`,
            backgroundSize: '120px 120px'
          }}
        />
      </div>

      <header className="p-6 relative z-10">
        <div className="max-w-7xl mx-auto flex justify-between items-center">
          <button 
            onClick={() => router.push('/')}
            className="w-12 h-12 rounded-2xl bg-surface-container-low border border-primary/5 shadow-sm flex items-center justify-center text-on-surface active:scale-95 transition-all hover:bg-surface-container-highest"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>

          {!isLogin && (
            <div className="hidden md:flex items-center gap-2 px-6 py-2 bg-primary/5 rounded-full border border-primary/10">
              <span className="w-2 h-2 rounded-full bg-primary animate-pulse" />
              <span className="text-[10px] font-black uppercase tracking-widest text-primary">Secure Enrollment</span>
            </div>
          )}
        </div>
      </header>

      <main className="flex-1 flex flex-col items-center justify-center px-6 pb-20 relative z-10">
        <motion.div 
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ type: 'spring', damping: 25, stiffness: 120 }}
          className="w-full max-w-md lg:max-w-xl bg-white/80 backdrop-blur-3xl rounded-[3.5rem] p-8 md:p-14 shadow-2xl shadow-primary/5 border border-primary/5 relative"
        >
          {/* Logo Section */}
          <div className="flex flex-col items-center mb-12">
            <motion.div 
              whileHover={{ rotate: 5, scale: 1.05 }}
              className="w-20 h-20 rounded-[2rem] signature-gradient flex items-center justify-center shadow-2xl shadow-primary/30 mb-6 group relative"
            >
              <div className="absolute inset-0 bg-white/20 rounded-[2rem] opacity-0 group-hover:opacity-100 transition-opacity" />
              {settings?.logo ? (
                <Image src={settings.logo} alt="Logo" width={48} height={48} className="object-contain" unoptimized />
              ) : (
                <Droplets className="text-white w-10 h-10 fill-current drop-shadow-md" />
              )}
            </motion.div>
            <h1 className="text-4xl font-headline font-black tracking-tighter text-on-surface">
              {settings?.name || 'Quick-Wash'}
            </h1>
            <div className="h-1 w-12 bg-primary rounded-full mt-3 opacity-20" />
          </div>

          <div className="text-center mb-10 overflow-hidden">
            <AnimatePresence mode="wait">
              <motion.div
                key={authMode + (isLogin ? 'true' : 'false')}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
              >
                <h2 className="text-2xl font-headline font-black mb-2 text-on-surface">
                  {authMode === 'forgot' ? 'Recover Access' : 
                   authMode === 'reset' ? 'Finalize Reset' :
                   isLogin ? 'Hello Again!' : `Start as ${role.toUpperCase()}`}
                </h2>
                <p className="text-on-surface-variant text-sm font-medium">
                  {authMode === 'forgot' ? 'We\'ll send a secure code to your account' :
                   authMode === 'reset' ? 'One last step to secure your workspace' :
                   isLogin ? 'Sign in to access your dashboard' : `Fill in your ${role} credentials`}
                </p>
              </motion.div>
            </AnimatePresence>
          </div>

          {/* Form and Other stuff... */}

          {resetMessage && (
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className={cn(
                "mb-6 p-4 rounded-2xl text-sm font-bold text-center border",
                resetMessage.type === 'success' ? "bg-primary-container text-on-primary-container border-primary/20" : "bg-error-container text-on-error-container border-error/20"
              )}
            >
              {resetMessage.text}
            </motion.div>
          )}

          {authMode === 'auth' ? (
            <>
              {message === 'pending' && (
                <motion.div 
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="mb-6 p-6 bg-primary-container text-on-primary-container rounded-[2rem] text-sm font-bold text-center border border-primary/20 shadow-sm"
                >
                  <Sparkles className="w-8 h-8 mx-auto mb-2 text-primary" />
                  Registration submitted! <br />
                  Please wait for admin approval before logging in.
                </motion.div>
              )}

              {error && (
                <motion.div 
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="mb-6 p-4 bg-error-container text-on-error-container rounded-2xl text-sm font-bold text-center border border-error/20"
                >
                  {error}
                </motion.div>
              )}

              <form onSubmit={handleSubmit} className="space-y-4">
            <AnimatePresence mode="wait">
              {!isLogin && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  className="space-y-4 overflow-hidden"
                >
                  <div className="relative">
                    <User className="absolute left-5 top-1/2 -translate-y-1/2 text-on-surface-variant w-5 h-5" />
                    <input 
                      type="email" 
                      placeholder="Email Address (Required)"
                      required={!isLogin}
                      value={formData.email}
                      onChange={(e) => setFormData({...formData, email: e.target.value})}
                      className="w-full h-16 bg-surface-container-low rounded-2xl pl-14 pr-6 font-headline font-bold outline-none focus:ring-4 focus:ring-primary-container transition-all"
                    />
                  </div>

                  <div className="relative">
                    <User className="absolute left-5 top-1/2 -translate-y-1/2 text-on-surface-variant w-5 h-5" />
                    <input 
                      type="text" 
                      placeholder="Full Name"
                      required={!isLogin}
                      value={formData.fullName}
                      onChange={(e) => setFormData({...formData, fullName: e.target.value})}
                      className="w-full h-16 bg-surface-container-low rounded-2xl pl-14 pr-6 font-headline font-bold outline-none focus:ring-4 focus:ring-primary-container transition-all"
                    />
                  </div>

                  {(role === 'customer' || role === 'rider' || role === 'vendor') && (
                    <div className="relative">
                      <MapPin className="absolute left-5 top-1/2 -translate-y-1/2 text-on-surface-variant w-5 h-5" />
                      <select 
                        value={formData.landmark}
                        onChange={(e) => setFormData({...formData, landmark: e.target.value})}
                        className="w-full h-16 bg-surface-container-low rounded-2xl pl-14 pr-6 font-headline font-bold outline-none focus:ring-4 focus:ring-primary-container transition-all appearance-none"
                      >
                        <option value="Under-G">Under-G (Campus Area)</option>
                        <option value="Adenike">Adenike (Off-Campus)</option>
                        <option value="Main Gate">Main Gate (Entrance)</option>
                        <option value="Aroje">Aroje (Residential)</option>
                        <option value="Stadium">Stadium Area</option>
                        <option value="General">General Area</option>
                      </select>
                    </div>
                  )}

                  {role === 'rider' && (
                    <>
                      <div className="relative">
                        <Lock className="absolute left-5 top-1/2 -translate-y-1/2 text-on-surface-variant w-5 h-5" />
                        <input 
                          type="text" 
                          placeholder="NIN (11 Digits)"
                          required={role === 'rider' && !isLogin}
                          maxLength={11}
                          value={formData.nin}
                          onChange={(e) => setFormData({...formData, nin: e.target.value})}
                          className="w-full h-16 bg-surface-container-low rounded-2xl pl-14 pr-6 font-headline font-bold outline-none focus:ring-4 focus:ring-primary-container transition-all"
                        />
                      </div>
                      <div className="relative">
                        <MapPin className="absolute left-5 top-1/2 -translate-y-1/2 text-on-surface-variant w-5 h-5" />
                        <input 
                          type="text" 
                          placeholder="Home Address"
                          required={role === 'rider' && !isLogin}
                          value={formData.address}
                          onChange={(e) => setFormData({...formData, address: e.target.value})}
                          className="w-full h-16 bg-surface-container-low rounded-2xl pl-14 pr-6 font-headline font-bold outline-none focus:ring-4 focus:ring-primary-container transition-all"
                        />
                      </div>
                      <div className="space-y-2">
                        <p className="text-[10px] font-black uppercase tracking-widest text-on-surface-variant ml-2">Upload NIN Document (Photo)</p>
                        <div 
                          onClick={() => document.getElementById('nin-upload')?.click()}
                          className="w-full h-32 bg-surface-container-low rounded-2xl border-2 border-dashed border-primary/20 flex flex-col items-center justify-center cursor-pointer hover:bg-primary/5 transition-all overflow-hidden"
                        >
                          {formData.ninImage ? (
                            <div className="relative w-full h-full">
                              <Image src={formData.ninImage} alt="NIN" fill className="object-cover" unoptimized />
                            </div>
                          ) : (
                            <>
                              <Sparkles className="w-6 h-6 text-primary mb-2" />
                              <span className="text-xs font-bold text-primary">SELECT NIN PHOTO</span>
                            </>
                          )}
                        </div>
                        <input 
                          id="nin-upload"
                          type="file" 
                          accept="image/*"
                          onChange={handleImageUpload('ninImage')}
                          className="hidden"
                        />
                      </div>
                      <div className="grid grid-cols-1 gap-4">
                        <input 
                          type="text" 
                          placeholder="Bank Account Name"
                          required={role === 'rider' && !isLogin}
                          value={formData.bankAccountName}
                          onChange={(e) => setFormData({...formData, bankAccountName: e.target.value})}
                          className="w-full h-16 bg-surface-container-low rounded-2xl px-6 font-headline font-bold outline-none focus:ring-4 focus:ring-primary-container transition-all"
                        />
                        <input 
                          type="text" 
                          placeholder="Bank Account Number"
                          required={role === 'rider' && !isLogin}
                          minLength={10}
                          maxLength={10}
                          pattern="[0-9]*"
                          value={formData.bankAccountNumber}
                          onChange={(e) => setFormData({...formData, bankAccountNumber: e.target.value.replace(/\D/g, '')})}
                          className="w-full h-16 bg-surface-container-low rounded-2xl px-6 font-headline font-bold outline-none focus:ring-4 focus:ring-primary-container transition-all"
                        />
                        <input 
                          type="text" 
                          placeholder="Bank Name"
                          required={role === 'rider' && !isLogin}
                          value={formData.bankName}
                          onChange={(e) => setFormData({...formData, bankName: e.target.value})}
                          className="w-full h-16 bg-surface-container-low rounded-2xl px-6 font-headline font-bold outline-none focus:ring-4 focus:ring-primary-container transition-all"
                        />
                      </div>
                      <div className="relative">
                        <Bike className="absolute left-5 top-1/2 -translate-y-1/2 text-on-surface-variant w-5 h-5" />
                        <select 
                          value={formData.vehicleType}
                          onChange={(e) => setFormData({...formData, vehicleType: e.target.value})}
                          className="w-full h-16 bg-surface-container-low rounded-2xl pl-14 pr-6 font-headline font-bold outline-none focus:ring-4 focus:ring-primary-container transition-all appearance-none"
                        >
                          <option value="Bicycle">Bicycle</option>
                          <option value="Motorcycle">Motorcycle</option>
                          <option value="Foot">Foot</option>
                          <option value="Car">Car</option>
                        </select>
                      </div>
                    </>
                  )}

                  {role === 'vendor' && (
                    <>
                      <div className="relative">
                        <Store className="absolute left-5 top-1/2 -translate-y-1/2 text-on-surface-variant w-5 h-5" />
                        <input 
                          type="text" 
                          placeholder="Laundry Shop Name"
                          required={role === 'vendor' && !isLogin}
                          value={formData.shopName}
                          onChange={(e) => setFormData({...formData, shopName: e.target.value})}
                          className="w-full h-16 bg-surface-container-low rounded-2xl pl-14 pr-6 font-headline font-bold outline-none focus:ring-4 focus:ring-primary-container transition-all"
                        />
                      </div>
                      <div className="relative">
                        <MapPin className="absolute left-5 top-1/2 -translate-y-1/2 text-on-surface-variant w-5 h-5" />
                        <input 
                          type="text" 
                          placeholder="Shop Address"
                          required={role === 'vendor' && !isLogin}
                          value={formData.shopAddress}
                          onChange={(e) => setFormData({...formData, shopAddress: e.target.value})}
                          className="w-full h-16 bg-surface-container-low rounded-2xl pl-14 pr-6 font-headline font-bold outline-none focus:ring-4 focus:ring-primary-container transition-all"
                        />
                      </div>
                      <div className="space-y-2">
                        <p className="text-[10px] font-black uppercase tracking-widest text-on-surface-variant ml-2">Upload Shop Storefront/Workspace Photo</p>
                        <div 
                          onClick={() => document.getElementById('shop-upload')?.click()}
                          className="w-full h-32 bg-surface-container-low rounded-2xl border-2 border-dashed border-primary/20 flex flex-col items-center justify-center cursor-pointer hover:bg-primary/5 transition-all overflow-hidden"
                        >
                          {formData.shopImage ? (
                            <div className="relative w-full h-full">
                              <Image src={formData.shopImage} alt="Shop" fill className="object-cover" unoptimized />
                            </div>
                          ) : (
                            <>
                              <Store className="w-6 h-6 text-primary mb-2" />
                              <span className="text-xs font-bold text-primary">SELECT SHOP PHOTO</span>
                            </>
                          )}
                        </div>
                        <input 
                          id="shop-upload"
                          type="file" 
                          accept="image/*"
                          onChange={handleImageUpload('shopImage')}
                          className="hidden"
                        />
                      </div>
                    <div className="relative">
                      <Phone className="absolute left-5 top-1/2 -translate-y-1/2 text-on-surface-variant w-5 h-5" />
                      <input 
                        type="tel" 
                        placeholder="WhatsApp Number (For Customers)"
                        required={role === 'vendor' && !isLogin}
                        value={formData.whatsappNumber}
                        onChange={(e) => setFormData({...formData, whatsappNumber: e.target.value})}
                        className="w-full h-16 bg-surface-container-low rounded-2xl pl-14 pr-6 font-headline font-bold outline-none focus:ring-4 focus:ring-primary-container transition-all"
                      />
                    </div>
                      <div className="grid grid-cols-1 gap-4">
                        <input 
                          type="text" 
                          placeholder="Bank Account Name"
                          required={role === 'vendor' && !isLogin}
                          value={formData.bankAccountName}
                          onChange={(e) => setFormData({...formData, bankAccountName: e.target.value})}
                          className="w-full h-16 bg-surface-container-low rounded-2xl px-6 font-headline font-bold outline-none focus:ring-4 focus:ring-primary-container transition-all"
                        />
                        <input 
                          type="text" 
                          placeholder="Bank Account Number"
                          required={role === 'vendor' && !isLogin}
                          minLength={10}
                          maxLength={10}
                          pattern="[0-9]*"
                          value={formData.bankAccountNumber}
                          onChange={(e) => setFormData({...formData, bankAccountNumber: e.target.value.replace(/\D/g, '')})}
                          className="w-full h-16 bg-surface-container-low rounded-2xl px-6 font-headline font-bold outline-none focus:ring-4 focus:ring-primary-container transition-all"
                        />
                        <input 
                          type="text" 
                          placeholder="Bank Name"
                          required={role === 'vendor' && !isLogin}
                          value={formData.bankName}
                          onChange={(e) => setFormData({...formData, bankName: e.target.value})}
                          className="w-full h-16 bg-surface-container-low rounded-2xl px-6 font-headline font-bold outline-none focus:ring-4 focus:ring-primary-container transition-all"
                        />
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <select 
                          value={formData.turnaroundTime}
                          onChange={(e) => setFormData({...formData, turnaroundTime: e.target.value})}
                          className="w-full h-16 bg-surface-container-low rounded-2xl px-6 font-headline font-bold outline-none focus:ring-4 focus:ring-primary-container transition-all appearance-none"
                        >
                          <option value="6hr">6 Hours</option>
                          <option value="24hr">24 Hours</option>
                          <option value="48hr">48 Hours</option>
                        </select>
                        <input 
                          type="number" 
                          placeholder="Max Bags/Day"
                          required={role === 'vendor' && !isLogin}
                          value={formData.capacity}
                          onChange={(e) => setFormData({...formData, capacity: Number(e.target.value)})}
                          className="w-full h-16 bg-surface-container-low rounded-2xl px-6 font-headline font-bold outline-none focus:ring-4 focus:ring-primary-container transition-all"
                        />
                      </div>
                    </>
                  )}
                </motion.div>
              )}
            </AnimatePresence>

            <div className="relative">
              {isLogin ? (
                <User className="absolute left-5 top-1/2 -translate-y-1/2 text-on-surface-variant w-5 h-5" />
              ) : (
                <Phone className="absolute left-5 top-1/2 -translate-y-1/2 text-on-surface-variant w-5 h-5" />
              )}
              <input 
                type={isLogin ? "text" : "tel"} 
                placeholder={isLogin ? "Email or Phone Number" : "Login Phone Number (11 Digits)"}
                required
                maxLength={isLogin ? undefined : 11}
                value={formData.phoneNumber}
                onChange={(e) => setFormData({...formData, phoneNumber: e.target.value})}
                className="w-full h-16 bg-surface-container-low rounded-2xl pl-14 pr-6 font-headline font-bold outline-none focus:ring-4 focus:ring-primary-container transition-all"
              />
            </div>

            <div className="relative">
              <Lock className="absolute left-5 top-1/2 -translate-y-1/2 text-on-surface-variant w-5 h-5 pointer-events-none" />
              <input 
                type={showPassword ? "text" : "password"} 
                placeholder="Password"
                required
                value={formData.password}
                onChange={(e) => setFormData({...formData, password: e.target.value})}
                className="w-full h-16 bg-surface-container-low rounded-2xl pl-14 pr-14 font-headline font-bold outline-none focus:ring-4 focus:ring-primary-container transition-all border border-transparent focus:border-primary/20"
              />
              <button 
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-5 top-1/2 -translate-y-1/2 text-on-surface-variant hover:text-primary transition-colors p-2"
              >
                {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
              </button>
            </div>

            {isLogin && (
              <div className="flex justify-end pr-2">
                <button 
                  type="button"
                  onClick={() => {
                    setAuthMode('forgot');
                    setResetMessage(null);
                  }}
                  className="text-xs font-black uppercase tracking-widest text-primary hover:text-primary-variant transition-colors"
                >
                  Forgot Password?
                </button>
              </div>
            )}

            <button 
              type="submit"
              disabled={isProcessing}
              className="w-full h-16 signature-gradient text-white rounded-[1.25rem] font-headline font-black text-lg shadow-xl shadow-primary/20 hover:shadow-primary/40 active:scale-[0.98] transition-all flex items-center justify-center gap-2 mt-4 disabled:opacity-70 disabled:active:scale-100"
            >
              {isProcessing ? (
                <div className="flex items-center gap-2">
                  <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  <span>Processing Hub...</span>
                </div>
              ) : (
                <>
                  {isLogin ? 'Sign In Now' : 'Complete Setup'}
                  <ChevronRight className="w-5 h-5" />
                </>
              )}
            </button>

            {isLogin && (
              <div className="pt-8">
                <div className="relative mb-8">
                  <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-primary/10"></div></div>
                  <div className="relative flex justify-center text-[10px] uppercase font-black tracking-widest"><span className="bg-white px-4 text-on-surface-variant">Secure Gateways</span></div>
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <button type="button" className="h-14 rounded-2xl bg-surface-container-low border border-primary/5 flex items-center justify-center gap-2 hover:bg-surface-container-highest transition-all group">
                    <Github className="w-5 h-5 text-on-surface" />
                    <span className="text-xs font-bold text-on-surface">GitHub</span>
                  </button>
                  <button type="button" className="h-14 rounded-2xl bg-surface-container-low border border-primary/5 flex items-center justify-center gap-2 hover:bg-surface-container-highest transition-all group">
                    <Globe className="w-5 h-5 text-primary" />
                    <span className="text-xs font-bold text-on-surface">Universal</span>
                  </button>
                </div>
              </div>
            )}
          </form>
          </>
          ) : authMode === 'forgot' ? (
            <form onSubmit={handleForgotPassword} className="space-y-4">
              <div className="relative">
                <User className="absolute left-5 top-1/2 -translate-y-1/2 text-on-surface-variant w-5 h-5" />
                <input 
                  type="text" 
                  placeholder="Email or Phone Number"
                  required
                  value={resetData.identifier}
                  onChange={(e) => setResetData({...resetData, identifier: e.target.value})}
                  className="w-full h-16 bg-surface-container-low rounded-2xl pl-14 pr-6 font-headline font-bold outline-none focus:ring-4 focus:ring-primary-container transition-all"
                />
              </div>
              <button 
                type="submit"
                className="w-full h-16 signature-gradient text-white rounded-2xl font-headline font-black text-lg shadow-xl shadow-primary/20 active:scale-[0.98] transition-all flex items-center justify-center gap-2 mt-4"
              >
                Send Reset Code
                <ChevronRight className="w-5 h-5" />
              </button>
              <button 
                type="button"
                onClick={() => setAuthMode('auth')}
                className="w-full text-center py-2 text-on-surface-variant font-bold text-sm"
              >
                Back to Login
              </button>
            </form>
          ) : (
            <form onSubmit={handleResetPassword} className="space-y-4">
              <div className="relative">
                <Lock className="absolute left-5 top-1/2 -translate-y-1/2 text-on-surface-variant w-5 h-5" />
                <input 
                  type="text" 
                  placeholder="Verification Code"
                  required
                  value={resetData.code}
                  onChange={(e) => setResetData({...resetData, code: e.target.value})}
                  className="w-full h-16 bg-surface-container-low rounded-2xl pl-14 pr-6 font-headline font-bold outline-none focus:ring-4 focus:ring-primary-container transition-all"
                />
              </div>
              <div className="relative">
                <Lock className="absolute left-5 top-1/2 -translate-y-1/2 text-on-surface-variant w-5 h-5" />
                <input 
                  type="password" 
                  placeholder="New Password"
                  required
                  value={resetData.newPassword}
                  onChange={(e) => setResetData({...resetData, newPassword: e.target.value})}
                  className="w-full h-16 bg-surface-container-low rounded-2xl pl-14 pr-6 font-headline font-bold outline-none focus:ring-4 focus:ring-primary-container transition-all"
                />
              </div>
              <button 
                type="submit"
                className="w-full h-16 signature-gradient text-white rounded-2xl font-headline font-black text-lg shadow-xl shadow-primary/20 active:scale-[0.98] transition-all flex items-center justify-center gap-2 mt-4"
              >
                Reset Password
                <ChevronRight className="w-5 h-5" />
              </button>
              <button 
                type="button"
                onClick={() => setAuthMode('forgot')}
                className="w-full text-center py-2 text-on-surface-variant font-bold text-sm"
              >
                Resend Code
              </button>
            </form>
          )}

          {authMode === 'auth' && (
            <div className="mt-8 text-center">
              <button 
                onClick={() => setIsLogin(!isLogin)}
                className="text-on-surface-variant font-bold hover:text-primary transition-colors"
              >
                {isLogin ? "Don't have an account? Sign Up" : "Already have an account? Login"}
              </button>
            </div>
          )}
        </motion.div>
      </main>
    </div>
  );
}

export default function AuthPage() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center font-headline font-black">Loading...</div>}>
      <AuthContent />
    </Suspense>
  );
}
