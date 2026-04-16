'use client';

import React, { useState, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { useAuth, UserRole } from '@/hooks/use-auth';
import { Droplets, ArrowLeft, Phone, Lock, User, MapPin, ChevronRight, Sparkles, Store, Bike } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { cn } from '@/lib/utils';

function AuthContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const { signup, login, isProcessing, error } = useAuth();
  
  const role = (searchParams.get('role') as UserRole) || 'customer';
  const initialIsLogin = searchParams.get('login') === 'true';
  const message = searchParams.get('message');
  const [isLogin, setIsLogin] = useState(initialIsLogin);
  
  const [showPassword, setShowPassword] = useState(false);
  
  const [formData, setFormData] = useState({
    fullName: '',
    phoneNumber: '',
    password: '',
    landmark: 'Under-G',
    shopName: '',
    shopAddress: '',
    vehicleType: 'Bicycle',
    nin: '',
    address: '',
    whatsappNumber: '',
    bankAccountName: '',
    bankAccountNumber: '',
    bankName: '',
    turnaroundTime: '24hr',
    capacity: 10
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (isLogin) {
      login(formData.phoneNumber, formData.password);
    } else {
      signup({
        fullName: formData.fullName,
        phoneNumber: formData.phoneNumber,
        password: formData.password,
        landmark: (role === 'customer' || role === 'rider') ? formData.landmark : undefined,
        role: role,
        shopName: role === 'vendor' ? formData.shopName : undefined,
        shopAddress: role === 'vendor' ? formData.shopAddress : undefined,
        vehicleType: role === 'rider' ? formData.vehicleType : undefined,
        nin: role === 'rider' ? formData.nin : undefined,
        address: role === 'rider' ? formData.address : undefined,
        whatsappNumber: role === 'vendor' ? formData.whatsappNumber : undefined,
        bankAccountName: (role === 'vendor' || role === 'rider') ? formData.bankAccountName : undefined,
        bankAccountNumber: (role === 'vendor' || role === 'rider') ? formData.bankAccountNumber : undefined,
        bankName: (role === 'vendor' || role === 'rider') ? formData.bankName : undefined,
        turnaroundTime: role === 'vendor' ? formData.turnaroundTime : undefined,
        capacity: role === 'vendor' ? Number(formData.capacity) : undefined
      });
    }
  };

  return (
    <div className="min-h-screen bg-surface flex flex-col">
      <header className="p-6">
        <button 
          onClick={() => router.push('/')}
          className="w-12 h-12 rounded-2xl bg-surface-container-low flex items-center justify-center text-on-surface active:scale-95 transition-transform"
        >
          <ArrowLeft className="w-6 h-6" />
        </button>
      </header>

      <main className="flex-1 flex flex-col items-center justify-center px-6 pb-12">
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="w-full max-w-md"
        >
          <div className="flex items-center gap-3 mb-8 justify-center">
            <div className="w-12 h-12 rounded-2xl signature-gradient flex items-center justify-center shadow-lg">
              <Droplets className="text-white w-7 h-7 fill-current" />
            </div>
            <h1 className="text-3xl font-headline font-black tracking-tighter">Quick-Wash</h1>
          </div>

          <div className="text-center mb-10">
            <h2 className="text-4xl font-headline font-black mb-2">
              {isLogin ? 'Welcome Back!' : `Join as ${role.charAt(0).toUpperCase() + role.slice(1)}`}
            </h2>
            <p className="text-on-surface-variant font-medium">
              {isLogin ? 'Enter your details to continue' : 'Create your account to get started'}
            </p>
          </div>

          {message === 'pending' && (
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="mb-6 p-6 bg-primary-container text-on-primary-container rounded-[2rem] text-sm font-bold text-center border border-primary/20 shadow-sm"
            >
              <Sparkles className="w-8 h-8 mx-auto mb-2 text-primary" />
              Registration submitted! <br/>
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
              <Phone className="absolute left-5 top-1/2 -translate-y-1/2 text-on-surface-variant w-5 h-5" />
              <input 
                type="tel" 
                placeholder={isLogin ? "Phone Number" : "Login Phone Number (11 Digits)"}
                required
                maxLength={11}
                value={formData.phoneNumber}
                onChange={(e) => setFormData({...formData, phoneNumber: e.target.value})}
                className="w-full h-16 bg-surface-container-low rounded-2xl pl-14 pr-6 font-headline font-bold outline-none focus:ring-4 focus:ring-primary-container transition-all"
              />
            </div>

            <div className="relative">
              <Lock className="absolute left-5 top-1/2 -translate-y-1/2 text-on-surface-variant w-5 h-5" />
              <input 
                type={showPassword ? "text" : "password"} 
                placeholder="Password"
                required
                value={formData.password}
                onChange={(e) => setFormData({...formData, password: e.target.value})}
                className="w-full h-16 bg-surface-container-low rounded-2xl pl-14 pr-14 font-headline font-bold outline-none focus:ring-4 focus:ring-primary-container transition-all"
              />
              <button 
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-5 top-1/2 -translate-y-1/2 text-on-surface-variant hover:text-primary transition-colors"
              >
                {showPassword ? (
                  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M9.88 9.88L4.62 4.62"/><path d="M1 1l22 22"/><path d="M10.47 4.38A12.5 12.5 0 0 1 23 12a12.5 12.5 0 0 1-2.47 3.62"/><path d="M13.02 19.44A12.5 12.5 0 0 1 1 12a12.5 12.5 0 0 1 5.02-6.44"/><circle cx="12" cy="12" r="3"/><path d="M14.22 14.22a3 3 0 1 1-4.24-4.24"/></svg>
                ) : (
                  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>
                )}
              </button>
            </div>

            <button 
              type="submit"
              disabled={isProcessing}
              className="w-full h-16 signature-gradient text-white rounded-2xl font-headline font-black text-lg shadow-xl shadow-primary/20 active:scale-[0.98] transition-all flex items-center justify-center gap-2 mt-4 disabled:opacity-70 disabled:active:scale-100"
            >
              {isProcessing ? (
                <div className="flex items-center gap-2">
                  <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  <span>Processing...</span>
                </div>
              ) : (
                <>
                  {isLogin ? 'Login' : 'Create Account'}
                  <ChevronRight className="w-5 h-5" />
                </>
              )}
            </button>
          </form>

          <div className="mt-8 text-center">
            <button 
              onClick={() => setIsLogin(!isLogin)}
              className="text-on-surface-variant font-bold hover:text-primary transition-colors"
            >
              {isLogin ? "Don't have an account? Sign Up" : "Already have an account? Login"}
            </button>
          </div>
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
