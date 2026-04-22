"use client";

import { cn } from "@/lib/utils";
import { ChevronRight, MapPin, Search, Map as MapIcon } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import React from "react";

export const landmarks = [
  {
    id: "lautech-gate",
    name: "LAUTECH Main Gate",
    tag: "Primary Hub",
    image: "https://picsum.photos/seed/lautech/800/400",
    featured: true,
  },
  {
    id: "under-g",
    name: "Under G",
    info: "4 Wash Hubs nearby",
    icon: "school",
  },
  {
    id: "adenike",
    name: "Adenike",
    info: "9 active vendors",
    icon: "apartment",
  },
  {
    id: "cele-area",
    name: "Cele Area",
    info: "Express pickup available",
    icon: "church",
    fullWidth: true,
  },
  {
    id: "fapote",
    name: "Fapote",
    icon: "science",
  },
  {
    id: "stadium",
    name: "Stadium",
    icon: "store",
  },
];

export default function LandmarkSelector() {
  const [search, setSearch] = React.useState("");

  const filtered = landmarks.filter((l) =>
    l.name.toLowerCase().includes(search.toLowerCase()),
  );

  return (
    <div className="space-y-8 pb-10">
      {/* Search & Location Section */}
      <section className="space-y-4">
        <div className="relative group">
          <Search className="absolute left-5 top-1/2 -translate-y-1/2 text-outline group-focus-within:text-primary transition-colors w-5 h-5" />
          <input
            className="w-full h-16 pl-14 pr-6 bg-surface-container-low border-none rounded-3xl text-on-surface placeholder:text-on-surface-variant focus:ring-2 focus:ring-primary/20 focus:bg-surface-container-lowest transition-all outline-none"
            placeholder="Search campus areas (e.g. Under G)"
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        <button className="w-full h-16 bg-surface-container-lowest flex items-center justify-center gap-3 rounded-3xl shadow-sm active:scale-[0.98] transition-transform group border border-outline/5">
          <MapPin className="text-primary w-5 h-5 group-hover:animate-bounce" />
          <span className="font-bold text-primary">Use Current Location</span>
        </button>
      </section>

      {/* Landmarks Grid */}
      <section className="space-y-6">
        <div className="flex items-center justify-between my-8">
          <h3 className="font-label text-[10px] uppercase tracking-[0.2em] font-black text-outline">
            Popular Landmarks
          </h3>
          <span className="h-[1px] flex-1 bg-primary/10 ml-4"></span>
        </div>

        {filtered.length > 0 ? (
          <div className="grid grid-cols-2 gap-4">
            {filtered.map((landmark) => (
              <Link
                key={landmark.id}
                href="/vendors"
                className={cn(
                  "relative rounded-[2rem] overflow-hidden group cursor-pointer active:scale-[0.96] transition-all duration-300",
                  landmark.featured
                    ? "col-span-2 h-52 shadow-xl shadow-primary/10"
                    : landmark.fullWidth
                      ? "col-span-2 flex items-center gap-6 bg-surface-container-low p-6"
                      : "bg-surface-container-low p-7 flex flex-col justify-between aspect-square",
                )}
              >
                {landmark.featured ? (
                  <>
                    <Image
                      src={landmark.image!}
                      alt={landmark.name}
                      fill
                      className="object-cover transition-transform duration-1000 group-hover:scale-110"
                      referrerPolicy="no-referrer"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent"></div>
                    <div className="absolute bottom-6 left-6 right-6 flex justify-between items-end">
                      <div className="space-y-1">
                        <span className="bg-primary text-white text-[9px] font-black px-3 py-1 rounded-full mb-2 inline-block uppercase tracking-widest">
                          {landmark.tag}
                        </span>
                        <h4 className="text-2xl font-black text-white tracking-tight">
                          {landmark.name}
                        </h4>
                      </div>
                      <div className="w-10 h-10 bg-white/20 backdrop-blur-md rounded-full flex items-center justify-center">
                        <ChevronRight className="text-white w-6 h-6" />
                      </div>
                    </div>
                  </>
                ) : (
                  <>
                    <div
                      className={cn(
                        "w-12 h-12 rounded-2xl flex items-center justify-center transition-colors",
                        landmark.fullWidth
                          ? "bg-secondary/10"
                          : "bg-primary/10",
                      )}
                    >
                      <MapPin
                        className={cn(
                          "w-6 h-6",
                          landmark.fullWidth
                            ? "text-secondary"
                            : "text-primary",
                        )}
                      />
                    </div>
                    <div className={cn(landmark.fullWidth && "flex-1")}>
                      <h4 className="text-lg font-black text-on-surface leading-tight">
                        {landmark.name}
                      </h4>
                      {landmark.info && (
                        <p className="text-[10px] font-bold text-on-surface-variant opacity-60 mt-1 uppercase tracking-tighter">
                          {landmark.info}
                        </p>
                      )}
                    </div>
                    {landmark.fullWidth && (
                      <ChevronRight className="text-outline/30 w-6 h-6" />
                    )}
                  </>
                )}
              </Link>
            ))}
          </div>
        ) : (
          <div className="py-20 flex flex-col items-center justify-center text-center space-y-4 opacity-40">
            <MapIcon className="w-12 h-12" />
            <p className="font-bold text-sm uppercase tracking-widest">
              No landmarks found nearby
            </p>
          </div>
        )}
      </section>
    </div>
  );
}
