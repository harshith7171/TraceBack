'use client';

import React from 'react';
import { Memory } from '@/lib/types';
import MemoryCard from './MemoryCard';
import { ArrowRight, Inbox } from 'lucide-react';

interface MemoryGridProps {
  memories: Memory[];
  activeFilter: string;
  onSelectFilter: (filter: string) => void;
  onOpenDetail: (memory: Memory) => void;
  onToggleFavorite: (id: string) => void;
  onDelete: (id: string) => void;
  onViewAll?: () => void;
}

export default function MemoryGrid({
  memories,
  activeFilter,
  onSelectFilter,
  onOpenDetail,
  onToggleFavorite,
  onDelete,
  onViewAll,
}: MemoryGridProps) {
  const filterPills = [
    { id: 'all', label: 'All' },
    { id: 'pdfs', label: 'PDFs' },
    { id: 'pptx', label: 'PPTs' },
    { id: 'images', label: 'Images' },
    { id: 'notes', label: 'Notes' },
    { id: 'links', label: 'Links' },
    { id: 'documents', label: 'Documents' },
    { id: 'favorites', label: 'Favorites' },
  ];

  return (
    <div className="space-y-6">
      {/* Recent Memories Header */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-bold text-slate-900">Recent Memories</h3>
          <button
            onClick={onViewAll}
            className="text-xs font-semibold text-blue-600 hover:text-blue-700 flex items-center gap-1 transition group"
          >
            <span>View all</span>
            <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
          </button>
        </div>

        {/* Memories Grid */}
        {memories.length === 0 ? (
          <div className="bg-white rounded-2xl border border-slate-200/80 p-8 text-center">
            <Inbox className="w-10 h-10 text-slate-300 mx-auto mb-2" />
            <h4 className="text-sm font-semibold text-slate-700">No memories found</h4>
            <p className="text-xs text-slate-400 mt-1">Upload files, save links or add notes to start remembering.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {memories.slice(0, 4).map((memory) => (
              <MemoryCard
                key={memory.id}
                memory={memory}
                onOpenDetail={onOpenDetail}
                onToggleFavorite={onToggleFavorite}
                onDelete={onDelete}
              />
            ))}
          </div>
        )}
      </div>

      {/* Quick Filters Section */}
      <div className="pt-2">
        <div className="flex items-center justify-between mb-3">
          <h4 className="text-base font-bold text-slate-900">Quick Filters</h4>
          <button
            onClick={onViewAll}
            className="text-xs font-semibold text-blue-600 hover:text-blue-700 flex items-center gap-1 transition group"
          >
            <span>View all</span>
            <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
          </button>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {filterPills.map((pill) => {
            const isActive = activeFilter.toLowerCase() === pill.id;
            return (
              <button
                key={pill.id}
                onClick={() => onSelectFilter(pill.id)}
                className={`px-4 py-2 rounded-full text-xs font-semibold transition-all duration-150 ${
                  isActive
                    ? 'bg-blue-600 text-white shadow-xs'
                    : 'bg-white text-slate-600 hover:bg-slate-100 hover:text-slate-900 border border-slate-200/90'
                }`}
              >
                {pill.label}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
