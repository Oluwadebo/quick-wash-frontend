'use client';

import React from 'react';
import TopAppBar from '@/components/shared/TopAppBar';
import { Shirt, ShoppingBag, Bed, Sparkles, Plus, Edit3, Trash2, Check, X, Droplets, Zap, Info } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { cn } from '@/lib/utils';
import ProtectedRoute from '@/components/shared/ProtectedRoute';

interface ServicePrice {
  wash: number;
  iron: number;
  washIron: number;
  whitePremium: number;
}

interface SubService {
  id: string;
  name: string;
  price: number;
}

interface Service {
  id: string;
  name: string;
  category: string;
  prices: ServicePrice;
  subServices?: SubService[];
  icon: any;
  color: string;
}

const defaultServices: Service[] = [
  { 
    id: 'shirts', 
    name: 'Shirts & Tops', 
    category: 'General', 
    prices: { wash: 200, iron: 150, washIron: 300, whitePremium: 100 },
    icon: Shirt, 
    color: 'bg-primary-container text-on-primary-container' 
  },
  { 
    id: 'trousers', 
    name: 'Trousers & Jeans', 
    category: 'General', 
    prices: { wash: 250, iron: 200, washIron: 400, whitePremium: 150 },
    icon: ShoppingBag, 
    color: 'bg-secondary-container text-on-secondary-container' 
  },
  { 
    id: 'beddings', 
    name: 'Beddings', 
    category: 'Special', 
    prices: { wash: 0, iron: 0, washIron: 0, whitePremium: 0 },
    subServices: [
      { id: 'bedsheet', name: 'Bedsheet', price: 400 },
      { id: 'duvet', name: 'Duvet', price: 1200 },
      { id: 'pillowcase', name: 'Pillow Case', price: 150 }
    ],
    icon: Bed, 
    color: 'bg-tertiary-container text-on-tertiary-container' 
  }
];

export default function PriceListPage() {
  const [services, setServices] = React.useState<Service[]>([]);
  const [editingId, setEditingId] = React.useState<string | null>(null);
  const [isAdding, setIsAdding] = React.useState(false);
  const [user, setUser] = React.useState<any>(null);

  React.useEffect(() => {
    const currentUser = JSON.parse(localStorage.getItem('qw_user') || '{}');
    setUser(currentUser);
    const stored = localStorage.getItem(`qw_services_${currentUser.phoneNumber}`);
    if (stored) {
      setServices(JSON.parse(stored));
    } else {
      setServices(defaultServices);
      localStorage.setItem(`qw_services_${currentUser.phoneNumber}`, JSON.stringify(defaultServices));
    }
  }, []);

  const saveServices = (updated: Service[]) => {
    setServices(updated);
    localStorage.setItem(`qw_services_${user.phoneNumber}`, JSON.stringify(updated));
  };

  const handleDelete = (id: string) => {
    if (confirm('Are you sure you want to delete this service?')) {
      saveServices(services.filter(s => s.id !== id));
    }
  };

  const handleUpdatePrice = (id: string, field: keyof ServicePrice, value: number) => {
    const updated = services.map(s => {
      if (s.id === id) {
        return { ...s, prices: { ...s.prices, [field]: value } };
      }
      return s;
    });
    saveServices(updated);
  };

  const handleUpdateSubPrice = (serviceId: string, subId: string, value: number) => {
    const updated = services.map(s => {
      if (s.id === serviceId) {
        const updatedSubs = s.subServices?.map(sub => 
          sub.id === subId ? { ...sub, price: value } : sub
        );
        return { ...s, subServices: updatedSubs };
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
        return { ...s, subServices: [...(s.subServices || []), newSub] };
      }
      return s;
    });
    saveServices(updated);
  };

  const removeSubService = (serviceId: string, subId: string) => {
    const updated = services.map(s => {
      if (s.id === serviceId) {
        return { ...s, subServices: s.subServices?.filter(sub => sub.id !== subId) };
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
        const updatedSubs = s.subServices?.map(sub => 
          sub.id === subId ? { ...sub, name } : sub
        );
        return { ...s, subServices: updatedSubs };
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
      prices: { wash: 0, iron: 0, washIron: 0, whitePremium: 0 },
      icon: Droplets,
      color: 'bg-surface-container-highest text-on-surface'
    };
    saveServices([...services, newService]);
    setEditingId(newService.id);
  };

  return (
    <ProtectedRoute allowedRoles={['vendor']}>
      <div className="pb-32">
        <TopAppBar roleLabel="Vendor" showAudioToggle />
        
        <main className="pt-24 px-6 max-w-7xl mx-auto">
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
                      <service.icon className="w-10 h-10" />
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
                  {service.subServices && service.subServices.length > 0 ? (
                    service.subServices.map(sub => (
                      <div key={sub.id} className="bg-white p-4 rounded-2xl border border-primary/5 text-center">
                        <p className="text-[10px] font-black uppercase tracking-widest text-on-surface-variant mb-1">{sub.name}</p>
                        <p className="text-lg font-headline font-black text-primary">₦{sub.price}</p>
                      </div>
                    ))
                  ) : (
                    <>
                      <div className="bg-white p-4 rounded-2xl border border-primary/5 text-center">
                        <p className="text-[10px] font-black uppercase tracking-widest text-on-surface-variant mb-1">Wash</p>
                        <p className="text-lg font-headline font-black text-primary">₦{service.prices.wash}</p>
                      </div>
                      <div className="bg-white p-4 rounded-2xl border border-primary/5 text-center">
                        <p className="text-[10px] font-black uppercase tracking-widest text-on-surface-variant mb-1">Iron</p>
                        <p className="text-lg font-headline font-black text-primary">₦{service.prices.iron}</p>
                      </div>
                      <div className="bg-white p-4 rounded-2xl border border-primary/5 text-center">
                        <p className="text-[10px] font-black uppercase tracking-widest text-on-surface-variant mb-1">Wash+Iron</p>
                        <p className="text-lg font-headline font-black text-primary">₦{service.prices.washIron}</p>
                      </div>
                      <div className="bg-white p-4 rounded-2xl border border-primary/5 text-center">
                        <p className="text-[10px] font-black uppercase tracking-widest text-on-surface-variant mb-1">White</p>
                        <p className="text-lg font-headline font-black text-tertiary">₦{service.prices.whitePremium}</p>
                      </div>
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
                        {service.subServices ? (
                          <>
                            {service.subServices.map(sub => (
                              <div key={sub.id} className="space-y-2 p-4 bg-surface-container-lowest rounded-2xl border border-primary/5 relative group/sub">
                                <button 
                                  onClick={() => removeSubService(service.id, sub.id)}
                                  className="absolute -top-2 -right-2 w-6 h-6 bg-error text-white rounded-full flex items-center justify-center opacity-0 group-hover/sub:opacity-100 transition-opacity"
                                >
                                  <X className="w-3 h-3" />
                                </button>
                                <input 
                                  value={sub.name}
                                  onChange={(e) => updateSubServiceName(service.id, sub.id, e.target.value)}
                                  className="font-label text-[10px] font-black uppercase tracking-widest text-on-surface-variant bg-transparent border-b border-primary/20 outline-none w-full mb-2"
                                />
                                <div className="relative">
                                  <span className="absolute left-4 top-1/2 -translate-y-1/2 font-bold text-primary">₦</span>
                                  <input 
                                    type="number"
                                    value={sub.price}
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
                            {(Object.keys(service.prices) as Array<keyof ServicePrice>).map(field => (
                              <div key={field} className="space-y-2">
                                <label className="font-label text-[10px] font-black uppercase tracking-widest text-on-surface-variant">{field.replace(/([A-Z])/g, ' $1')} Price</label>
                                <div className="relative">
                                  <span className="absolute left-4 top-1/2 -translate-y-1/2 font-bold text-primary">₦</span>
                                  <input 
                                    type="number"
                                    value={service.prices[field]}
                                    onChange={(e) => handleUpdatePrice(service.id, field, parseInt(e.target.value) || 0)}
                                    className="w-full h-12 bg-surface-container-lowest rounded-xl pl-10 pr-4 font-headline font-bold outline-none border border-primary/10 focus:border-primary"
                                  />
                                </div>
                              </div>
                            ))}
                            <button 
                              onClick={() => {
                                const updated = services.map(s => s.id === service.id ? { ...s, subServices: [] } : s);
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
