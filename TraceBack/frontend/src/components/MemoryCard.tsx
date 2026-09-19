'use client';

import React, { useState } from 'react';
import { Memory } from '@/lib/types';
import {
  FileText,
  Link2,
  Image as ImageIcon,
  MoreVertical,
  Star,
  ExternalLink,
  Trash2,
  Eye,
  Copy,
  Presentation,
} from 'lucide-react';

interface MemoryCardProps {
  memory: Memory;
  onOpenDetail: (memory: Memory) => void;
  onToggleFavorite: (id: string) => void;
  onDelete: (id: string) => void;
}

export default function MemoryCard({
  memory,
  onOpenDetail,
  onToggleFavorite,
  onDelete,
}: MemoryCardProps) {
  const [showMenu, setShowMenu] = useState(false);

  // Format display date: "Sep 12, 2026"
  const formatDate = (dateStr: string) => {
    try {
      const d = new Date(dateStr);
      return d.toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
      });
    } catch {
      return dateStr;
    }
  };

  const getTypeBadge = () => {
    switch (memory.memory_type) {
      case 'screenshot':
        return { label: 'Screenshot', color: 'text-indigo-600 bg-indigo-50 border-indigo-100' };
      case 'pdf':
        return { label: 'PDF', color: 'text-rose-600 bg-rose-50 border-rose-100' };
      case 'pptx':
      case 'presentation':
        return { label: 'Presentation', color: 'text-amber-700 bg-amber-50 border-amber-200' };
      case 'link':
        return { label: 'Link', color: 'text-blue-600 bg-blue-50 border-blue-100' };
      case 'image':
        return { label: 'Image', color: 'text-amber-600 bg-amber-50 border-amber-100' };
      case 'note':
        return { label: 'Note', color: 'text-emerald-600 bg-emerald-50 border-emerald-100' };
      default:
        return { label: 'Document', color: 'text-slate-600 bg-slate-50 border-slate-100' };
    }
  };

  const badge = getTypeBadge();

  return (
    <div className="bg-white rounded-2xl border border-slate-200/80 p-3.5 flex flex-col justify-between hover:shadow-md hover:border-slate-300/80 transition-all duration-200 group relative">
      {/* Top Preview Area */}
      <div 
        onClick={() => onOpenDetail(memory)}
        className="w-full h-28 rounded-xl overflow-hidden mb-3.5 bg-slate-50 flex items-center justify-center cursor-pointer relative border border-slate-100"
      >
        {memory.preview_image_url ? (
          /* eslint-disable-next-line @next/next/no-img-element */
          <img
            src={
              memory.preview_image_url.startsWith('/api/')
                ? `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8001'}${memory.preview_image_url}`
                : memory.preview_image_url
            }
            alt={memory.title}
            className="w-full h-full object-cover group-hover:scale-103 transition-transform duration-200"
          />
        ) : memory.memory_type === 'pdf' ? (
          <div className="flex flex-col items-center justify-center text-rose-500 bg-rose-50/50 w-full h-full">
            <div className="p-3 bg-rose-100/70 rounded-xl mb-1">
              <FileText className="w-7 h-7" />
            </div>
            <span className="text-[11px] font-bold tracking-wider uppercase text-rose-600">PDF Document</span>
          </div>
        ) : memory.memory_type === 'pptx' || memory.memory_type === 'presentation' ? (
          <div className="flex flex-col items-center justify-center text-amber-600 bg-amber-50/50 w-full h-full">
            <div className="p-3 bg-amber-100/80 rounded-xl mb-1">
              <Presentation className="w-7 h-7" />
            </div>
            <span className="text-[11px] font-bold tracking-wider uppercase text-amber-700">Presentation (PPTX)</span>
          </div>
        ) : memory.memory_type === 'link' ? (
          <div className="flex flex-col items-center justify-center text-blue-500 bg-blue-50/50 w-full h-full">
            <div className="p-3 bg-blue-100/70 rounded-xl mb-1">
              <Link2 className="w-7 h-7" />
            </div>
            <span className="text-[11px] font-bold tracking-wider uppercase text-blue-600">Web Link</span>
          </div>
        ) : memory.memory_type === 'note' ? (
          <div className="flex flex-col items-center justify-center text-emerald-500 bg-emerald-50/50 w-full h-full">
            <div className="p-3 bg-emerald-100/70 rounded-xl mb-1">
              <FileText className="w-7 h-7" />
            </div>
            <span className="text-[11px] font-bold tracking-wider uppercase text-emerald-600">Text Note</span>
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center text-slate-400 bg-slate-50 w-full h-full">
            <ImageIcon className="w-8 h-8" />
          </div>
        )}

        {/* Favorite indicator chip */}
        {memory.is_favorite && (
          <div className="absolute top-2 right-2 p-1 rounded-full bg-white/90 text-amber-500 shadow-xs">
            <Star className="w-3.5 h-3.5 fill-amber-400" />
          </div>
        )}
      </div>

      {/* Details */}
      <div className="flex-1 flex flex-col cursor-pointer" onClick={() => onOpenDetail(memory)}>
        {/* Badge */}
        <span className={`self-start text-[11px] font-semibold px-2 py-0.5 rounded-md border mb-1.5 ${badge.color}`}>
          {badge.label}
        </span>

        {/* Title */}
        <h3 className="font-bold text-slate-800 text-sm leading-snug mb-1 line-clamp-1 group-hover:text-blue-600 transition-colors">
          {memory.title}
        </h3>

        {/* Snippet */}
        <p className="text-xs text-slate-500 line-clamp-2 leading-relaxed mb-3">
          {memory.content_snippet || memory.extracted_text || 'No description available'}
        </p>
      </div>

      {/* Footer / Meta */}
      <div className="flex items-center justify-between pt-2 border-t border-slate-100 text-xs text-slate-400">
        <span>{formatDate(memory.created_at)}</span>

        {/* 3-dots Menu Button */}
        <div className="relative">
          <button
            onClick={(e) => {
              e.stopPropagation();
              setShowMenu(!showMenu);
            }}
            className="p-1 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-md transition"
            aria-label="Options"
          >
            <MoreVertical className="w-4 h-4" />
          </button>

          {/* Context Menu Dropdown */}
          {showMenu && (
            <div 
              onClick={(e) => e.stopPropagation()}
              className="absolute right-0 bottom-full mb-1 w-40 bg-white rounded-xl shadow-lg border border-slate-200/80 py-1.5 z-30 animate-in fade-in zoom-in-95 text-xs text-slate-700"
            >
              <button
                onClick={() => {
                  setShowMenu(false);
                  onOpenDetail(memory);
                }}
                className="w-full px-3 py-2 flex items-center gap-2 hover:bg-slate-50"
              >
                <Eye className="w-3.5 h-3.5 text-slate-500" />
                <span>View Details</span>
              </button>

              <button
                onClick={() => {
                  setShowMenu(false);
                  onToggleFavorite(memory.id);
                }}
                className="w-full px-3 py-2 flex items-center gap-2 hover:bg-slate-50"
              >
                <Star className={`w-3.5 h-3.5 ${memory.is_favorite ? 'fill-amber-400 text-amber-500' : 'text-slate-500'}`} />
                <span>{memory.is_favorite ? 'Unfavorite' : 'Favorite'}</span>
              </button>

              {memory.source_url && (
                <a
                  href={memory.source_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  onClick={() => setShowMenu(false)}
                  className="w-full px-3 py-2 flex items-center gap-2 hover:bg-slate-50"
                >
                  <ExternalLink className="w-3.5 h-3.5 text-slate-500" />
                  <span>Open URL</span>
                </a>
              )}

              <button
                onClick={() => {
                  setShowMenu(false);
                  if (memory.extracted_text) {
                    navigator.clipboard.writeText(memory.extracted_text);
                  }
                }}
                className="w-full px-3 py-2 flex items-center gap-2 hover:bg-slate-50"
              >
                <Copy className="w-3.5 h-3.5 text-slate-500" />
                <span>Copy Extracted Text</span>
              </button>

              <div className="border-t border-slate-100 my-1" />

              <button
                onClick={() => {
                  setShowMenu(false);
                  onDelete(memory.id);
                }}
                className="w-full px-3 py-2 flex items-center gap-2 text-red-600 hover:bg-red-50"
              >
                <Trash2 className="w-3.5 h-3.5 text-red-500" />
                <span>Delete</span>
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
