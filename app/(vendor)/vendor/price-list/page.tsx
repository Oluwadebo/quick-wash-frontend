'use client';

import React from 'react';
import TopAppBar from '@/components/shared/TopAppBar';
import { Shirt, ShoppingBag, Bed, Sparkles, Plus, Edit3, Trash2, Check, X, Droplets, Zap, Info, Eye, EyeOff } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { cn } from '@/lib/utils';
import ProtectedRoute from '@/components/shared/ProtectedRoute';
import { api } from '@/lib/ApiService';
import { useAuth } from '@/hooks/use-auth';

interface SubService {
  id: string;
  name: string;
  price: number;
}

const iconMap: Record<string, React.ElementType> = {
  Shirt,
  ShoppingBag,
  Bed,
  Droplets,
  Sparkles,
  Zap
};

interface Service {
  id: string;
  name: string;
  category: string;
  washPrice: number;
  ironPrice: number;
  washIronPrice: number;
  whitePremium: number;
  starchIronPrice: number;
  starchWashIronPrice: number;
  washDisabled?: boolean;
  ironDisabled?: boolean;
  washIronDisabled?: boolean;
  starchIronDisabled?: boolean;
  starchWashIronDisabled?: boolean;
  subItems?: SubService[];
  icon: string;
  color: string;
}

const defaultServices: Service[] = [
  { 
    id: 'shirts', 
    name: 'Shirts & Tops', 
    category: 'General', 
    washPrice: 200, ironPrice: 150, washIronPrice: 300, whitePremium: 100,
    starchIronPrice: 250, starchWashIronPrice: 400,
    icon: 'Shirt', 
    color: 'bg-primary-container text-on-primary-container' 
  },
  { 
    id: 'trousers', 
    name: 'Trousers & Jeans', 
    category: 'General', 
    washPrice: 250, ironPrice: 200, washIronPrice: 400, whitePremium: 150,
    starchIronPrice: 300, starchWashIronPrice: 500,
    icon: 'ShoppingBag', 
    color: 'bg-secondary-container text-on-secondary-container' 
  },
  { 
    id: 'beddings', 
    name: 'Beddings', 
    category: 'Special', 
    washPrice: 0, ironPrice: 0, washIronPrice: 0, whitePremium: 0,
    starchIronPrice: 0, starchWashIronPrice: 0,
    subItems: [
      { id: 'bedsheet', name: 'Bedsheet', price: 400 },
      { id: 'duvet', name: 'Duvet', price: 1200 },
      { id: 'pillowcase', name: 'Pillow Case', price: 150 }
    ],
    icon: 'Bed', 
    color: 'bg-tertiary-container text-on-tertiary-container' 
  }
];

export default function PriceListPage() {
  const { user: authUser } = useAuth();
  const [services, setServices] = React.useState<Service[]>([]);
  const [editingId, setEditingId] = React.useState<string | null>(null);
  const [user, setUser] = React.useState<any>(null);

  React.useEffect(() => {
    const init = async () => {
      if (authUser?.uid) {
        setUser(authUser);
        const stored = await api.getVendorPriceList(authUser.uid);
        if (stored && stored.length > 0) {
          setServices(stored);
        } else {
          setServices(defaultServices);
          await api.saveVendorPriceList(authUser.uid, defaultServices);
        }
      }
    };
    init();
  }, [authUser]);

  const saveServices = async (updated: Service[]) => {
    setServices(updated);
    if (user?.uid) {
      await api.saveVendorPriceList(user.uid, updated);
    }
  };

  const handleToggleOption = (id: string, field: 'wash' | 'iron' | 'washIron' | 'starchIron' | 'starchWashIron') => {
    const updated = services.map(s => {
      if (s.id === id) {
        if (field === 'wash') return { ...s, washDisabled: !s.washDisabled };
        if (field === 'iron') return { ...s, ironDisabled: !s.ironDisabled };
        if (field === 'washIron') return { ...s, washIronDisabled: !s.washIronDisabled };
        if (field === 'starchIron') return { ...s, starchIronDisabled: !s.starchIronDisabled };
        if (field === 'starchWashIron') return { ...s, starchWashIronDisabled: !s.starchWashIronDisabled };
      }
      return s;
    });
    saveServices(updated);
  };

  const handleDelete = (id: string) => {
    if (confirm('Are you sure you want to delete this service?')) {
      saveServices(services.filter(s => s.id !== id));
    }
  };

  const handleUpdatePrice = (id: string, field: 'washPrice' | 'ironPrice' | 'washIronPrice' | 'starchIronPrice' | 'starchWashIronPrice' | 'whitePremium', value: number) => {
    const updated = services.map(s => {
      if (s.id === id) {
        return { ...s, [field]: value };
      }
      return s;
    });
    saveServices(updated);
  };

  const handleUpdateSubPrice = (serviceId: string, subId: string, value: number) => {
    const updated = services.map(s => {
      if (s.id === serviceId) {
        const updatedSubs = s.subItems?.map(sub => 
          sub.id === subId ? { ...sub, price: value } : sub
        );
        return { ...s, subItems: updatedSubs };
      }
      return s;
    });
    saveServices(updated);
  };

  const addSubService = (serviceId: string) => {
    const updated = services.map(s => {
      if (s.id === serviceId) {
        const newSub: SubService = {
          id: Date.now().toString(),
          name: 'New Item',
          price: 0
        };
        return { ...s, subItems: [...(s.subItems || []), newSub] };
      }
      return s;
    });
    saveServices(updated);
  };

  const removeSubService = (serviceId: string, subId: string) => {
    const updated = services.map(s => {
      if (s.id === serviceId) {
        return { ...s, subItems: s.subItems?.filter(sub => sub.id !== subId) };
      }
      return s;
    });
    saveServices(updated);
  };

  const updateServiceName = (id: string, name: string) => {
    const updated = services.map(s => s.id === id ? { ...s, name } : s);
    saveServices(updated);
  };

  const updateSubServiceName = (serviceId: string, subId: string, name: string) => {
    const updated = services.map(s => {
      if (s.id === serviceId) {
        const updatedSubs = s.subItems?.map(sub => 
          sub.id === subId ? { ...sub, name } : sub
        );
        return { ...s, subItems: updatedSubs };
      }
      return s;
    });
    saveServices(updated);
  };

  const addNewService = () => {
    const newService: Service = {
      id: Date.now().toString(),
      name: 'New Service',
      category: 'Custom',
      washPrice: 0,
      ironPrice: 0,
      washIronPrice: 0,
      starchIronPrice: 0,
      starchWashIronPrice: 0,
      whitePremium: 0,
      icon: 'Droplets',
      color: 'bg-surface-container-highest text-on-surface'
    };
    saveServices([...services, newService]);
    setEditingId(newService.id);
  };

  return (
    <ProtectedRoute allowedRoles={['vendor']}>
      <div className="pb-32">
        <TopAppBar roleLabel="Vendor" />
        
        <main className="pt-8 px-6 max-w-7xl mx-auto">
          <header className="mb-12 flex flex-col md:flex-row md:items-end justify-between gap-6">
            <div>
              <div className="flex items-center gap-3 mb-2">
                <div className="w-10 h-10 rounded-xl bg-primary text-on-primary flex items-center justify-center">
                  <Droplets className="w-6 h-6 fill-current" />
                </div>
                <p className="font-label text-xs font-black uppercase tracking-[0.2em] text-primary">Service Management</p>
              </div>
              <h1 className="text-[3.5rem] leading-[0.95] font-headline font-black text-on-surface tracking-tighter">
                My Price List
              </h1>
            </div>
            <button 
              onClick={addNewService}
              className="signature-gradient text-white px-8 py-5 rounded-2xl font-headline font-black text-sm flex items-center gap-3 shadow-xl active:scale-95 transition-all"
            >
              <Plus className="w-5 h-5" />
              Add New Service
            </button>
          </header>

          <section className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {services.map((service, idx) => (
              <motion.div
                key={service.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: idx * 0.05 }}
                className="group bg-surface-container-low rounded-[2.5rem] p-8 border border-primary/5 hover:border-primary/20 transition-all relative overflow-hidden"
              >
                <div className="flex justify-between items-start mb-8">
                  <div className="flex items-center gap-6">
                    <div className={cn("w-20 h-20 rounded-[2rem] flex items-center justify-center shadow-xl", service.color)}>
                      {(() => {
                        const Icon = iconMap[service.icon] || Droplets;
                        return <Icon className="w-10 h-10" />;
                      })()}
                    </div>
                    <div>
                      <span className="font-label text-[10px] font-black uppercase tracking-widest text-on-surface-variant mb-1 block">
                        {service.category}
                      </span>
                      {editingId === service.id ? (
                        <input 
                          value={service.name}
                          onChange={(e) => updateServiceName(service.id, e.target.value)}
                          className="text-2xl font-headline font-black text-on-surface bg-transparent border-b-2 border-primary outline-none"
                        />
                      ) : (
                        <h3 className="text-2xl font-headline font-black text-on-surface">{service.name}</h3>
                      )}
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <button 
                      onClick={() => setEditingId(editingId === service.id ? null : service.id)}
                      className="p-3 rounded-xl bg-surface-container-highest text-on-surface-variant hover:text-primary transition-colors"
                    >
                      <Edit3 className="w-5 h-5" />
                    </button>
                    <button 
                      onClick={() => handleDelete(service.id)}
                      className="p-3 rounded-xl bg-surface-container-highest text-on-surface-variant hover:text-error transition-colors"
                    >
                      <Trash2 className="w-5 h-5" />
                    </button>
                  </div>
                </div>

                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  {service.subItems && service.subItems.length > 0 ? (
                    service.subItems.map(sub => (
                      <div key={sub.id} className="bg-white p-4 rounded-2xl border border-primary/5 text-center">
                        <p className="text-[10px] font-black uppercase tracking-widest text-on-surface-variant mb-1">{sub.name}</p>
                        <p className="text-lg font-headline font-black text-primary">₦{sub.price}</p>
                      </div>
                    ))
                  ) : (
                    <>
                      {!service.washDisabled && (
                        <div className="bg-white p-4 rounded-2xl border border-primary/5 text-center">
                          <p className="text-[10px] font-black uppercase tracking-widest text-on-surface-variant mb-1">Wash</p>
                          <p className="text-lg font-headline font-black text-primary">₦{service.washPrice}</p>
                        </div>
                      )}
                      {!service.ironDisabled && (
                        <div className="bg-white p-4 rounded-2xl border border-primary/5 text-center">
                          <p className="text-[10px] font-black uppercase tracking-widest text-on-surface-variant mb-1">Iron</p>
                          <p className="text-lg font-headline font-black text-primary">₦{service.ironPrice}</p>
                        </div>
                      )}
                      {!service.washIronDisabled && (
                        <div className="bg-white p-4 rounded-2xl border border-primary/5 text-center">
                          <p className="text-[10px] font-black uppercase tracking-widest text-on-surface-variant mb-1">Wash+Iron</p>
                          <p className="text-lg font-headline font-black text-primary">₦{service.washIronPrice}</p>
                        </div>
                      )}
                      {!service.starchIronDisabled && (
                        <div className="bg-white p-4 rounded-2xl border border-primary/5 text-center">
                          <p className="text-[10px] font-black uppercase tracking-widest text-on-surface-variant mb-1">S+Iron</p>
                          <p className="text-lg font-headline font-black text-primary">₦{service.starchIronPrice || 0}</p>
                        </div>
                      )}
                      {!service.starchWashIronDisabled && (
                        <div className="bg-white p-4 rounded-2xl border border-primary/5 text-center">
                          <p className="text-[10px] font-black uppercase tracking-widest text-on-surface-variant mb-1">S+W+I</p>
                          <p className="text-lg font-headline font-black text-primary">₦{service.starchWashIronPrice || 0}</p>
                        </div>
                      )}
                      {service.whitePremium > 0 && (
                        <div className="bg-white p-4 rounded-2xl border border-primary/5 text-center">
                          <p className="text-[10px] font-black uppercase tracking-widest text-on-surface-variant mb-1">White</p>
                          <p className="text-lg font-headline font-black text-tertiary">₦{service.whitePremium}</p>
                        </div>
                      )}
                    </>
                  )}
                </div>

                <AnimatePresence>
                  {editingId === service.id && (
                    <motion.div 
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: 20 }}
                      className="mt-8 pt-8 border-t border-primary/10 space-y-6"
                    >
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {service.subItems ? (
                          <>
                            {service.subItems.map(sub => (
                              <div key={sub.id} className="space-y-2 p-4 bg-surface-container-lowest rounded-2xl border border-primary/5 relative group/sub">
                                <button 
                                  onClick={() => removeSubService(service.id, sub.id)}
                                  className="absolute -top-2 -right-2 w-6 h-6 bg-error text-white rounded-full flex items-center justify-center shadow-lg active:scale-90 transition-all"
                                >
                                  <Trash2 className="w-3 h-3" />
                                </button>
                                <input 
                                  value={sub.name || ''}
                                  onChange={(e) => updateSubServiceName(service.id, sub.id, e.target.value)}
                                  className="font-label text-[10px] font-black uppercase tracking-widest text-on-surface-variant bg-transparent border-b border-primary/20 outline-none w-full mb-2"
                                />
                                <div className="relative">
                                  <span className="absolute left-4 top-1/2 -translate-y-1/2 font-bold text-primary">₦</span>
                                  <input 
                                    type="number"
                                    value={sub.price || 0}
                                    onChange={(e) => handleUpdateSubPrice(service.id, sub.id, parseInt(e.target.value) || 0)}
                                    className="w-full h-12 bg-white rounded-xl pl-10 pr-4 font-headline font-bold outline-none border border-primary/10 focus:border-primary"
                                  />
                                </div>
                              </div>
                            ))}
                            <button 
                              onClick={() => addSubService(service.id)}
                              className="md:col-span-2 h-12 border-2 border-dashed border-primary/20 rounded-xl flex items-center justify-center gap-2 text-primary font-headline font-bold text-xs hover:bg-primary/5 transition-colors"
                            >
                              <Plus className="w-4 h-4" /> Add Item (e.g. Duvet)
                            </button>
                          </>
                        ) : (
                          <>
                           {[
                              { label: 'Wash', val: service.washPrice, field: 'washPrice', disabled: service.washDisabled, toggle: 'wash' },
                              { label: 'Iron', val: service.ironPrice, field: 'ironPrice', disabled: service.ironDisabled, toggle: 'iron' },
                              { label: 'Wash + Iron', val: service.washIronPrice, field: 'washIronPrice', disabled: service.washIronDisabled, toggle: 'washIron' },
                              { label: 'Starch + Iron', val: service.starchIronPrice, field: 'starchIronPrice', disabled: service.starchIronDisabled, toggle: 'starchIron' },
                              { label: 'Starch+Wash+Iron', val: service.starchWashIronPrice, field: 'starchWashIronPrice', disabled: service.starchWashIronDisabled, toggle: 'starchWashIron' },
                              { label: 'White Premium', val: service.whitePremium, field: 'whitePremium' }
                           ].map(item => (
                              <div key={item.field} className={cn(
                                "space-y-2 p-4 rounded-2xl border transition-all relative group/price",
                                item.disabled ? "bg-surface-variant/10 opacity-40 grayscale" : "bg-surface-container-lowest border-primary/5"
                              )}>
                                {item.toggle && (
                                  <button 
                                    onClick={() => handleToggleOption(service.id, item.toggle as any)}
                                    className="absolute -top-2 -right-2 w-6 h-6 bg-primary text-white rounded-full flex items-center justify-center shadow-lg active:scale-90 transition-all"
                                  >
                                    {item.disabled ? <Plus className="w-3 h-3" /> : <EyeOff className="w-3 h-3" />}
                                  </button>
                                )}
                                <label className="font-label text-[10px] font-black uppercase tracking-widest text-on-surface-variant">{item.label} Price</label>
                                <div className="relative">
                                  <span className="absolute left-4 top-1/2 -translate-y-1/2 font-bold text-primary">₦</span>
                                  <input 
                                    type="number"
                                    disabled={item.disabled}
                                    value={item.disabled ? 0 : (item.val || 0)}
                                    onChange={(e) => handleUpdatePrice(service.id, item.field as any, parseInt(e.target.value) || 0)}
                                    className="w-full h-12 bg-white rounded-xl pl-10 pr-4 font-headline font-bold outline-none border border-primary/10 focus:border-primary"
                                  />
                                </div>
                              </div>
                            ))}
                            <button 
                              onClick={() => {
                                const updated = services.map(s => s.id === service.id ? { ...s, subItems: [] } : s);
                                saveServices(updated);
                              }}
                              className="md:col-span-2 h-12 border-2 border-dashed border-tertiary/20 rounded-xl flex items-center justify-center gap-2 text-tertiary font-headline font-bold text-xs hover:bg-tertiary/5 transition-colors"
                            >
                              <Plus className="w-4 h-4" /> Convert to Multi-Item (e.g. Beddings)
                            </button>
                          </>
                        )}
                      </div>
                      <button 
                        onClick={() => setEditingId(null)}
                        className="w-full h-14 bg-primary text-on-primary rounded-2xl font-headline font-black text-sm flex items-center justify-center gap-2 shadow-lg active:scale-95 transition-all"
                      >
                        <Check className="w-5 h-5" /> Save Changes
                      </button>
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>
            ))}
          </section>
        </main>
      </div>
    </ProtectedRoute>
  );
}
