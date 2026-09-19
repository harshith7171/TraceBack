'use client';

import React from 'react';
import { ActivityLog } from '@/lib/types';
import {
  ArrowRight,
  ImageIcon,
  Link2,
  FileText,
  Search,
  Lightbulb,
} from 'lucide-react';

interface RecentActivityProps {
  activities: ActivityLog[];
  onViewAll?: () => void;
  onActivityClick?: (act: ActivityLog) => void;
}

export default function RecentActivity({
  activities,
  onViewAll,
  onActivityClick,
}: RecentActivityProps) {
  const getActivityIcon = (actionType: string) => {
    switch (actionType) {
      case 'upload':
        return { icon: ImageIcon, color: 'text-blue-500 bg-blue-50' };
      case 'save_link':
        return { icon: Link2, color: 'text-purple-500 bg-purple-50' };
      case 'note':
        return { icon: FileText, color: 'text-amber-500 bg-amber-50' };
      case 'search':
        return { icon: Search, color: 'text-sky-500 bg-sky-50' };
      default:
        return { icon: FileText, color: 'text-rose-500 bg-rose-50' };
    }
  };

  return (
    <div className="space-y-6">
      {/* Activity Card */}
      <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-xs">
        <div className="flex items-center justify-between mb-4">
          <h4 className="text-base font-bold text-slate-900">Recent Activity</h4>
          <button
            onClick={onViewAll}
            className="text-xs font-semibold text-blue-600 hover:text-blue-700 flex items-center gap-1 transition group"
          >
            <span>View all</span>
            <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
          </button>
        </div>

        <div className="space-y-4">
          {activities.slice(0, 5).map((act) => {
            const { icon: Icon, color } = getActivityIcon(act.action_type);
            return (
              <div
                key={act.id}
                onClick={() => onActivityClick?.(act)}
                className="flex items-start justify-between gap-3 text-xs group cursor-pointer"
              >
                <div className="flex items-start gap-3">
                  <div className={`p-2 rounded-xl shrink-0 ${color} transition-transform group-hover:scale-105`}>
                    <Icon className="w-3.5 h-3.5" />
                  </div>
                  <div>
                    <p className="font-semibold text-slate-800 group-hover:text-blue-600 transition-colors">
                      {act.title}
                    </p>
                    <p className="text-slate-500 font-normal truncate max-w-[135px]">
                      {act.target}
                    </p>
                  </div>
                </div>

                <span className="text-[11px] text-slate-400 whitespace-nowrap pt-0.5">
                  {act.time_ago || 'Recently'}
                </span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Insight Banner at bottom */}
      <div className="bg-gradient-to-r from-blue-50/70 to-indigo-50/70 rounded-2xl border border-blue-100/80 p-4 flex items-center gap-3.5">
        <div className="p-2.5 rounded-xl bg-blue-100 text-blue-600 shrink-0">
          <Lightbulb className="w-5 h-5" />
        </div>
        <p className="text-xs text-slate-600 leading-relaxed font-medium">
          The more you save, the smarter <strong className="text-slate-900">TraceBack</strong> becomes.
        </p>
      </div>
    </div>
  );
}
