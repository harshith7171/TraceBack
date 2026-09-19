'use client';

import React, { useState } from 'react';
import { Search, ArrowRight } from 'lucide-react';

interface HeroBannerProps {
  onSearch: (query: string) => void;
  initialQuery?: string;
}

export default function HeroBanner({ onSearch, initialQuery = '' }: HeroBannerProps) {
  const [query, setQuery] = useState(initialQuery);

  const suggestedQueries = [
    'internship deadline',
    'machine learning PDF',
    'screenshot of schedule',
    'that travel website',
    'notes about DAA',
  ];

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (query.trim()) {
      onSearch(query.trim());
    }
  };

  const handleChipClick = (suggestion: string) => {
    setQuery(suggestion);
    onSearch(suggestion);
  };

  return (
    <div className="relative rounded-3xl overflow-hidden shadow-sm border border-slate-200/80 mb-6 select-none bg-gradient-to-r from-blue-100 via-sky-50 to-indigo-100">
      {/* Scenic landscape background illustration */}
      <div className="absolute inset-0 pointer-events-none opacity-40 mix-blend-multiply overflow-hidden">
        <svg viewBox="0 0 1000 300" preserveAspectRatio="none" className="w-full h-full">
          <defs>
            <linearGradient id="mountGrad1" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor="#93c5fd" stopOpacity="0.4" />
              <stop offset="100%" stopColor="#60a5fa" stopOpacity="0.8" />
            </linearGradient>
            <linearGradient id="mountGrad2" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor="#64748b" stopOpacity="0.3" />
              <stop offset="100%" stopColor="#334155" stopOpacity="0.6" />
            </linearGradient>
          </defs>
          <path d="M0,200 Q200,90 450,160 T900,100 L1000,140 L1000,300 L0,300 Z" fill="url(#mountGrad1)" />
          <path d="M0,220 Q300,140 600,210 T1000,170 L1000,300 L0,300 Z" fill="url(#mountGrad2)" opacity="0.4" />
        </svg>
      </div>

      {/* Content wrapper */}
      <div className="relative z-10 p-8 md:p-10">
        <div className="flex flex-col md:flex-row md:items-start justify-between gap-4 mb-6">
          <div>
            <h2 className="text-3xl md:text-4xl font-extrabold text-slate-900 tracking-tight mb-2">
              TraceBack
            </h2>
            <h3 className="text-lg md:text-xl font-bold text-slate-800 mb-1">
              Search your digital life, naturally.
            </h3>
            <p className="text-sm md:text-base text-slate-600 font-normal">
              Photos, PDFs, notes, links — find them using what you remember.
            </p>
          </div>

          {/* Handwritten aesthetic cursive caption on right */}
          <div className="hidden lg:block text-right self-center pr-4">
            <span className="font-serif italic text-slate-700/85 text-base tracking-wide rotate-[-3deg] inline-block">
              Your memories,<br />always within reach.
            </span>
          </div>
        </div>

        {/* Large Pill Search Bar */}
        <form onSubmit={handleSubmit} className="mb-4">
          <div className="bg-white rounded-full shadow-md hover:shadow-lg transition-shadow border border-slate-200/90 p-1.5 flex items-center pl-4 pr-1.5 gap-3 max-w-3xl">
            <Search className="w-5 h-5 text-slate-400 shrink-0" />
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder='Try "that website where I saw the internship deadline"'
              className="w-full bg-transparent text-slate-800 placeholder-slate-400 text-sm md:text-base outline-none pr-2"
            />
            <button
              type="submit"
              className="bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white text-sm font-semibold px-5 py-2.5 rounded-full flex items-center gap-1.5 shadow-sm transition-colors shrink-0"
            >
              <span>Search</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </form>

        {/* Suggested Query Chips */}
        <div className="flex flex-wrap items-center gap-2 text-xs text-slate-600">
          <span className="font-medium text-slate-500 mr-1">Try searching:</span>
          {suggestedQueries.map((item) => (
            <button
              key={item}
              onClick={() => handleChipClick(item)}
              type="button"
              className="bg-white/70 hover:bg-white text-slate-700 hover:text-blue-700 px-3 py-1.5 rounded-full border border-slate-300/70 hover:border-blue-300 shadow-2xs transition-all cursor-pointer font-medium"
            >
              {item}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
