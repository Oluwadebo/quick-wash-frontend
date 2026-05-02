'use client';

import React from 'react';
import { MapPin, ChevronRight, Search } from 'lucide-react';
import Link from 'next/link';
import Image from 'next/image';
import { motion } from 'motion/react';
import { cn } from '@/lib/utils';
import { api, SiteSettings, UserData } from '@/lib/ApiService';

export default function LandmarkSelector() {
  const [search, setSearch] = React.useState('');
  const [settings, setSettings] = React.useState<SiteSettings | null>(null);
  const [vendors, setVendors] = React.useState<UserData[]>([]);
  const [loading, setLoading] = React.useState(true);

  React.useEffect(() => {
    const load = async () => {
      try {
        const [s, v] = await Promise.all([
          api.getSiteSettings(),
          api.getVendors()
        ]);
        console.log(`[LandmarkSelector] Loaded ${v.length} vendors`);
        if (v.length > 0) {
          console.log(`[LandmarkSelector] Sample vendor landmark: ${v[0].landmark}`);
        }
        setSettings(s);
        setVendors(v as UserData[]);
      } catch (e) {
        console.error("Failed to load hotspots", e);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  const landmarkData = React.useMemo(() => {
    const availableLandmarks = settings?.landmarks || ["Under-G", "Adenike", "Main Gate", "Aroje", "Stadium"];
    
    return availableLandmarks.map((l: any) => {
      const name = typeof l === 'string' ? l : l.name;
      const normalizedName = name.trim().toLowerCase();
      
      const matchingVendors = vendors.filter(v => {
        if (!v.landmark) return false;
        const vLandmark = v.landmark.trim().toLowerCase();
        const nN = normalizedName.trim().toLowerCase();
        
        // Match if exact, or if one contains the other (e.g. "Under-G" vs "Under-G (Campus)")
        const match = vLandmark === nN || vLandmark.includes(nN) || nN.includes(vLandmark);
        return match;
      });

      const vendorCount = matchingVendors.length;
      
      if (vendorCount > 0) {
        console.log(`[LandmarkSelector] Landmark "${name}" has ${vendorCount} matches.`);
      }

      return {
        id: (typeof l === 'string' ? l : l.id || l.name).toLowerCase().replace(/\s+/g, '-'),
        name: name,
        info: `${vendorCount} ACTIVE VENDOR${vendorCount !== 1 ? 'S' : ''}`,
        featured: name === 'Main Gate' || name === 'LAUTECH Main Gate',
        image: `https://picsum.photos/seed/${encodeURIComponent(name)}/800/400`
      };
    });
  }, [settings, vendors]);

  const filtered = landmarkData.filter(l => 
    l.name.toLowerCase().includes(search.toLowerCase())
  );

  if (loading) {
    return (
      <div className="py-20 text-center">
        <div className="w-10 h-10 border-4 border-primary/20 border-t-primary rounded-full animate-spin mx-auto mb-4" />
        <p className="text-on-surface-variant font-bold">Scanning Hotspots...</p>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <section className="space-y-4">
        <div className="relative group">
          <Search className="absolute left-5 top-1/2 -translate-y-1/2 text-outline group-focus-within:text-primary transition-colors w-5 h-5" />
          <input 
            className="w-full h-16 pl-14 pr-6 bg-surface-container-low border-none rounded-3xl text-on-surface placeholder:text-on-surface-variant focus:ring-0 focus:bg-surface-container-lowest transition-all"
            placeholder="Search areas (e.g. Under G)"
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        
        <button 
          onClick={() => {
            alert("Detecting GPS coordinates... Please select your specific landmark manually for precise fee calculation.");
          }}
          className="w-full h-16 bg-surface-container-lowest flex items-center justify-center gap-3 rounded-3xl shadow-sm active:scale-[0.98] transition-transform border border-primary/5"
        >
          <MapPin className="text-primary w-5 h-5" />
          <span className="font-bold text-primary">Use Current Location</span>
        </button>
      </section>

      <section className="space-y-6">
        <div className="flex items-center justify-between my-8">
          <h3 className="font-label text-xs uppercase tracking-[0.2em] font-black text-outline">Production Hotspots</h3>
          <span className="h-0.5 flex-1 bg-primary/10 ml-4"></span>
        </div>

        <div className="grid grid-cols-2 gap-4">
          {filtered.map((landmark, idx) => (
            <Link 
              key={landmark.id} 
              href={`/vendors?landmark=${encodeURIComponent(landmark.name)}`}
              className={cn(
                "relative rounded-[40px] overflow-hidden group cursor-pointer active:scale-[0.98] transition-transform",
                landmark.featured ? "col-span-2 h-48" : "bg-[#dbfae5] p-8 flex flex-col justify-between aspect-square shadow-sm border border-green-200/50"
              )}
            >
              {landmark.featured ? (
                <>
                  <Image 
                    src={landmark.image} 
                    alt={landmark.name}
                    fill
                    className="object-cover transition-transform duration-700 group-hover:scale-110"
                    referrerPolicy="no-referrer"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-primary-dim/90 to-transparent"></div>
                  <div className="absolute bottom-6 left-6 right-6 flex justify-between items-end">
                    <div>
                      <span className="bg-primary-container text-on-primary-container text-[10px] font-label font-bold px-3 py-1 rounded-full mb-2 inline-block uppercase">
                        Featured Hub
                      </span>
                      <h4 className="text-2xl font-bold text-white lowercase">{landmark.name}</h4>
                      <p className="text-xs font-black text-white/80 uppercase">{landmark.info}</p>
                    </div>
                    <ChevronRight className="text-white w-8 h-8" />
                  </div>
                </>
              ) : (
                <>
                  <div className="w-12 h-12 bg-green-200/50 rounded-2xl flex items-center justify-center">
                    <MapPin className="text-green-700 w-6 h-6" />
                  </div>
                  <div>
                    <h4 className="text-2xl font-black text-green-900 leading-tight mb-1 lowercase">{landmark.name}</h4>
                    {landmark.info && (
                      <p className="text-[10px] font-black uppercase tracking-widest text-green-700/80">{landmark.info}</p>
                    )}
                  </div>
                </>
              )}
            </Link>
          ))}
          {filtered.length === 0 && (
            <div className="col-span-2 py-10 text-center opacity-50 italic">
              No regions found matching your search.
            </div>
          )}
        </div>
      </section>
    </div>
  );
}

