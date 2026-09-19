'use client';

import React, { useState, useRef, useEffect } from 'react';
import {
  Bell,
  ChevronDown,
  Database,
  HardDrive,
  CheckCheck,
  Sparkles,
  FileCheck2,
  Info,
} from 'lucide-react';
import { UserProfile, NotificationItem } from '@/lib/types';
import { markNotificationsAsRead } from '@/lib/api';

interface HeaderProps {
  user: UserProfile | null;
  notifications: NotificationItem[];
  onNotificationsUpdated: () => void;
}

export default function Header({
  user,
  notifications,
  onNotificationsUpdated,
}: HeaderProps) {
  const [showNotifications, setShowNotifications] = useState(false);
  const [showUserMenu, setShowUserMenu] = useState(false);

  const notifRef = useRef<HTMLDivElement>(null);
  const userRef = useRef<HTMLDivElement>(null);

  // Close menus when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (notifRef.current && !notifRef.current.contains(event.target as Node)) {
        setShowNotifications(false);
      }
      if (userRef.current && !userRef.current.contains(event.target as Node)) {
        setShowUserMenu(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const unreadCount = notifications.filter((n) => !n.is_read).length;

  const handleMarkAllRead = async () => {
    try {
      await markNotificationsAsRead();
      onNotificationsUpdated();
    } catch (err) {
      console.error('Failed to mark read', err);
    }
  };

  const getNotifIcon = (type: string) => {
    switch (type) {
      case 'indexing':
        return <FileCheck2 className="w-4 h-4 text-emerald-600" />;
      case 'insight':
        return <Sparkles className="w-4 h-4 text-indigo-600" />;
      default:
        return <Info className="w-4 h-4 text-blue-600" />;
    }
  };

  const userName = user?.full_name || 'Harshith';
  const userInitials = user?.initials || 'HU';
  const userEmail = user?.email || 'harshith@traceback.ai';
  const dbProvider = user?.db_provider || 'PostgreSQL (Cloud pgvector)';
  const storageFormatted = user?.storage_formatted || '13.8 MB / 5 GB';

  return (
    <header className="h-16 flex items-center justify-end px-8 gap-4 select-none relative z-40">
      {/* 1. Interactive Notification Bell */}
      <div className="relative" ref={notifRef}>
        <button
          onClick={() => {
            setShowNotifications(!showNotifications);
            setShowUserMenu(false);
          }}
          aria-label="Notifications"
          className="relative p-2 text-slate-500 hover:text-slate-800 hover:bg-slate-100 rounded-full transition cursor-pointer"
        >
          <Bell className="w-5 h-5 text-slate-600" />
          {unreadCount > 0 && (
            <span className="absolute top-1.5 right-1.5 w-2.5 h-2.5 bg-blue-500 rounded-full border-2 border-white animate-pulse" />
          )}
        </button>

        {/* Notifications Popover */}
        {showNotifications && (
          <div className="absolute right-0 top-full mt-2 w-80 sm:w-96 bg-white rounded-2xl shadow-xl border border-slate-200/90 py-3 z-50 animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between px-4 pb-2.5 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <h4 className="text-sm font-bold text-slate-900">Notifications</h4>
                {unreadCount > 0 && (
                  <span className="text-[10px] font-bold bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full">
                    {unreadCount} new
                  </span>
                )}
              </div>
              {unreadCount > 0 && (
                <button
                  onClick={handleMarkAllRead}
                  className="text-xs text-blue-600 hover:text-blue-700 font-semibold flex items-center gap-1 cursor-pointer"
                >
                  <CheckCheck className="w-3.5 h-3.5" />
                  <span>Mark all read</span>
                </button>
              )}
            </div>

            {/* List */}
            <div className="max-h-80 overflow-y-auto divide-y divide-slate-50">
              {notifications.length === 0 ? (
                <div className="p-6 text-center text-xs text-slate-400">
                  No notifications at this time.
                </div>
              ) : (
                notifications.map((n) => (
                  <div
                    key={n.id}
                    className={`p-3.5 hover:bg-slate-50 transition flex items-start gap-3 ${
                      !n.is_read ? 'bg-blue-50/40' : ''
                    }`}
                  >
                    <div className="p-2 rounded-xl bg-slate-100/80 shrink-0 mt-0.5">
                      {getNotifIcon(n.notification_type)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-1 mb-0.5">
                        <h5 className="text-xs font-bold text-slate-800 truncate">{n.title}</h5>
                        {!n.is_read && (
                          <span className="w-1.5 h-1.5 rounded-full bg-blue-500 shrink-0" />
                        )}
                      </div>
                      <p className="text-[11px] text-slate-500 leading-relaxed">{n.message}</p>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        )}
      </div>

      {/* 2. Interactive User Profile Pill */}
      <div className="relative" ref={userRef}>
        <div
          onClick={() => {
            setShowUserMenu(!showUserMenu);
            setShowNotifications(false);
          }}
          className="flex items-center gap-2.5 pl-2 cursor-pointer group py-1 px-2 rounded-xl hover:bg-slate-100/70 transition"
        >
          <div className="w-9 h-9 rounded-full bg-blue-500 text-white font-bold text-xs flex items-center justify-center shadow-xs">
            {userInitials}
          </div>
          <span className="text-sm font-semibold text-slate-700 group-hover:text-slate-900 transition">
            {userName}
          </span>
          <ChevronDown
            className={`w-4 h-4 text-slate-400 group-hover:text-slate-600 transition-transform duration-150 ${
              showUserMenu ? 'rotate-180' : ''
            }`}
          />
        </div>

        {/* User Profile Dropdown Menu */}
        {showUserMenu && (
          <div className="absolute right-0 top-full mt-2 w-72 bg-white rounded-2xl shadow-xl border border-slate-200/90 p-4 z-50 animate-in fade-in zoom-in-95 text-xs">
            {/* Header info */}
            <div className="flex items-center gap-3 pb-3 border-b border-slate-100">
              <div className="w-10 h-10 rounded-full bg-blue-500 text-white font-bold text-sm flex items-center justify-center shrink-0">
                {userInitials}
              </div>
              <div className="min-w-0">
                <p className="font-bold text-slate-900 truncate">{userName}</p>
                <p className="text-[11px] text-slate-500 truncate">{userEmail}</p>
              </div>
            </div>

            {/* Database & Storage status */}
            <div className="py-3 space-y-2 border-b border-slate-100">
              <div className="flex items-center justify-between text-slate-600">
                <div className="flex items-center gap-2">
                  <Database className="w-3.5 h-3.5 text-blue-500" />
                  <span>Database</span>
                </div>
                <div className="flex items-center gap-1.5 font-semibold text-slate-800">
                  <span className="w-2 h-2 rounded-full bg-emerald-500 inline-block animate-pulse" />
                  <span>{dbProvider}</span>
                </div>
              </div>

              <div className="flex items-center justify-between text-slate-600">
                <div className="flex items-center gap-2">
                  <HardDrive className="w-3.5 h-3.5 text-slate-400" />
                  <span>Memory Quota</span>
                </div>
                <span className="font-semibold text-slate-700">{storageFormatted}</span>
              </div>
            </div>

            {/* System Status info */}
            <div className="pt-2 text-center text-[11px] text-slate-400">
              TraceBack Memory Engine Active
            </div>
          </div>
        )}
      </div>
    </header>
  );
}
