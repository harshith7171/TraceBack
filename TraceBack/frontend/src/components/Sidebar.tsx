'use client';

import React from 'react';
import {
  Home,
  Search,
  UploadCloud,
  FolderOpen,
  Network,
  Star,
  Trash2,
  Settings,
  HelpCircle,
  Sparkles,
} from 'lucide-react';

interface SidebarProps {
  currentTab: string;
  onSelectTab: (tab: string) => void;
  onOpenUpload: () => void;
  favoritesCount?: number;
}

export default function Sidebar({
  currentTab,
  onSelectTab,
  onOpenUpload,
  favoritesCount = 0,
}: SidebarProps) {
  const navItems = [
    { id: 'home', label: 'Home', icon: Home },
    { id: 'search', label: 'Search', icon: Search },
    { id: 'upload', label: 'Upload', icon: UploadCloud, action: onOpenUpload },
    { id: 'library', label: 'My Library', icon: FolderOpen },
    { id: 'knowledge-map', label: 'Knowledge Map', icon: Network },
    { id: 'favorites', label: 'Favorites', icon: Star, badge: favoritesCount > 0 ? favoritesCount : undefined },
    { id: 'trash', label: 'Trash', icon: Trash2 },
  ];

  return (
    <aside className="w-64 bg-white border-r border-slate-200/80 min-h-screen flex flex-col justify-between p-5 select-none shrink-0">
      {/* Top section */}
      <div>
        {/* Logo */}
        <div 
          onClick={() => onSelectTab('home')}
          className="flex items-center gap-3 cursor-pointer mb-8 group"
        >
          <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-indigo-600 to-blue-500 flex items-center justify-center text-white shadow-md shadow-indigo-100 group-hover:scale-105 transition-transform">
            {/* Custom geometric logo icon matching screenshot */}
            <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83" />
            </svg>
          </div>
          <div>
            <h1 className="font-bold text-slate-800 text-lg leading-tight tracking-tight">TraceBack</h1>
            <p className="text-[11px] text-slate-400 font-medium">The Digital Memory Engine</p>
          </div>
        </div>

        {/* Nav Links */}
        <nav className="space-y-1.5">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = currentTab === item.id;

            return (
              <button
                key={item.id}
                onClick={() => {
                  if (item.action) {
                    item.action();
                  } else {
                    onSelectTab(item.id);
                  }
                }}
                className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-sm font-medium transition-all duration-150 ${
                  isActive
                    ? 'bg-blue-50/90 text-blue-600 font-semibold shadow-xs'
                    : 'text-slate-600 hover:bg-slate-100/70 hover:text-slate-900'
                }`}
              >
                <div className="flex items-center gap-3">
                  <Icon className={`w-4 h-4 ${isActive ? 'text-blue-600' : 'text-slate-400'}`} />
                  <span>{item.label}</span>
                </div>
                {item.badge !== undefined && (
                  <span className="text-xs bg-amber-100 text-amber-700 px-1.5 py-0.5 rounded-full font-bold">
                    {item.badge}
                  </span>
                )}
              </button>
            );
          })}
        </nav>
      </div>

      {/* Bottom section */}
      <div className="space-y-5 pt-4">
        {/* Scenic Quote Card */}
        <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-blue-100 via-indigo-50 to-blue-200/80 p-4 border border-blue-200/50 shadow-xs">
          {/* Subtle mountain graphic layer */}
          <div className="absolute inset-0 opacity-15 pointer-events-none flex items-end">
            <svg viewBox="0 0 200 80" className="w-full h-auto fill-blue-900">
              <polygon points="0,80 40,30 80,60 130,20 170,50 200,80" />
            </svg>
          </div>
          <div className="relative z-10 text-center py-2">
            <Sparkles className="w-4 h-4 text-blue-500 mx-auto mb-1.5 opacity-80" />
            <p className="text-[13px] font-medium text-slate-700 leading-snug italic">
              “Find anything you&apos;ve seen, whenever you need it.”
            </p>
          </div>
        </div>

        {/* Bottom Utility Links */}
        <div className="space-y-1 pt-1 border-t border-slate-100 text-sm">
          <button
            onClick={() => onSelectTab('settings')}
            className="w-full flex items-center gap-3 px-3 py-2 text-slate-500 hover:text-slate-800 rounded-lg hover:bg-slate-50 transition"
          >
            <Settings className="w-4 h-4 text-slate-400" />
            <span>Settings</span>
          </button>
          <button
            onClick={() => onSelectTab('help')}
            className="w-full flex items-center gap-3 px-3 py-2 text-slate-500 hover:text-slate-800 rounded-lg hover:bg-slate-50 transition"
          >
            <HelpCircle className="w-4 h-4 text-slate-400" />
            <span>Help</span>
          </button>
        </div>
      </div>
    </aside>
  );
}
