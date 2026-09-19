'use client';

import React, { useEffect, useState } from 'react';
import { Memory } from '@/lib/types';
import { fetchMemoryDetail } from '@/lib/api';
import {
  X,
  Star,
  Trash2,
  ExternalLink,
  Copy,
  Check,
  FileText,
  Calendar,
  Sparkles,
  Link2,
  Tag,
  Loader2,
} from 'lucide-react';

interface MemoryDetailModalProps {
  memory: Memory | null;
  onClose: () => void;
  onToggleFavorite: (id: string) => void;
  onDelete: (id: string) => void;
  onSelectMemory: (memory: Memory) => void;
}

export default function MemoryDetailModal({
  memory,
  onClose,
  onToggleFavorite,
  onDelete,
  onSelectMemory,
}: MemoryDetailModalProps) {
  const [copied, setCopied] = useState(false);
  const [related, setRelated] = useState<Memory[]>([]);
  const [loadingRelated, setLoadingRelated] = useState(false);

  useEffect(() => {
    if (memory) {
      setLoadingRelated(true);
      fetchMemoryDetail(memory.id)
        .then((res) => setRelated(res.related || []))
        .catch(() => setRelated([]))
        .finally(() => setLoadingRelated(false));
    }
  }, [memory]);

  if (!memory) return null;

  const handleCopyText = () => {
    const text = memory.extracted_text || memory.content_snippet || '';
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const formatDate = (dateStr: string) => {
    try {
      return new Date(dateStr).toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      });
    } catch {
      return dateStr;
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-xs p-4 animate-in fade-in">
      <div className="bg-white rounded-3xl max-w-2xl w-full max-h-[90vh] flex flex-col shadow-2xl border border-slate-200 overflow-hidden relative">
        {/* Top Header */}
        <div className="p-6 pb-4 border-b border-slate-100 flex items-start justify-between gap-4">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-2">
              <span className="text-xs font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-full bg-blue-50 text-blue-700 border border-blue-100">
                {memory.memory_type}
              </span>
              <span className="text-xs text-slate-400 flex items-center gap-1">
                <Calendar className="w-3.5 h-3.5" />
                {formatDate(memory.created_at)}
              </span>
            </div>
            <h2 className="text-xl font-bold text-slate-900 leading-snug">{memory.title}</h2>
          </div>

          <div className="flex items-center gap-1.5 shrink-0">
            <button
              onClick={() => onToggleFavorite(memory.id)}
              className="p-2 text-slate-400 hover:text-amber-500 hover:bg-amber-50 rounded-full transition"
              title={memory.is_favorite ? 'Favorited' : 'Add to Favorites'}
            >
              <Star className={`w-5 h-5 ${memory.is_favorite ? 'fill-amber-400 text-amber-500' : ''}`} />
            </button>
            <button
              onClick={onClose}
              className="p-2 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-full transition"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Scrollable Content */}
        <div className="p-6 overflow-y-auto space-y-6 flex-1">
          {/* Visual preview if available */}
          {memory.preview_image_url && (
            <div className="rounded-2xl overflow-hidden border border-slate-200/90 bg-slate-900/5 max-h-60 flex items-center justify-center">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={
                  memory.preview_image_url.startsWith('/api/')
                    ? `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8001'}${memory.preview_image_url}`
                    : memory.preview_image_url
                }
                alt={memory.title}
                className="w-full h-full object-contain max-h-60"
              />
            </div>
          )}

          {/* Web URL button */}
          {memory.source_url && (
            <div className="p-3 bg-blue-50/70 border border-blue-100 rounded-2xl flex items-center justify-between">
              <div className="flex items-center gap-2 text-xs text-blue-900 truncate">
                <Link2 className="w-4 h-4 text-blue-600 shrink-0" />
                <span className="font-semibold truncate">{memory.source_url}</span>
              </div>
              <a
                href={memory.source_url}
                target="_blank"
                rel="noopener noreferrer"
                className="text-xs bg-blue-600 hover:bg-blue-700 text-white font-semibold px-3 py-1.5 rounded-lg flex items-center gap-1 shrink-0 transition"
              >
                <span>Visit URL</span>
                <ExternalLink className="w-3.5 h-3.5" />
              </a>
            </div>
          )}

          {/* Tags */}
          {memory.tags && (
            <div className="flex items-center gap-1.5 flex-wrap">
              <Tag className="w-3.5 h-3.5 text-slate-400 mr-1" />
              {memory.tags.split(',').map((tag, idx) => (
                <span
                  key={idx}
                  className="text-xs bg-slate-100 text-slate-600 px-2.5 py-0.5 rounded-md font-medium"
                >
                  #{tag.trim()}
                </span>
              ))}
            </div>
          )}

          {/* Extracted Text Box */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
                <FileText className="w-4 h-4 text-slate-500" />
                <span>Extracted Content / OCR Text</span>
              </h4>
              <button
                onClick={handleCopyText}
                className="text-xs text-slate-500 hover:text-slate-800 flex items-center gap-1 px-2.5 py-1 rounded-md hover:bg-slate-100 transition"
              >
                {copied ? (
                  <>
                    <Check className="w-3.5 h-3.5 text-emerald-600" />
                    <span className="text-emerald-600 font-semibold">Copied!</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-3.5 h-3.5" />
                    <span>Copy Text</span>
                  </>
                )}
              </button>
            </div>

            <div className="bg-slate-50 rounded-2xl p-4 border border-slate-200/80 text-xs text-slate-700 font-mono whitespace-pre-wrap leading-relaxed max-h-56 overflow-y-auto">
              {memory.extracted_text || memory.content_snippet || 'No extracted text available.'}
            </div>
          </div>

          {/* Related Memories */}
          <div className="pt-2 border-t border-slate-100">
            <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider mb-3 flex items-center gap-1.5">
              <Sparkles className="w-4 h-4 text-indigo-500" />
              <span>Related Memories (Semantic Links)</span>
            </h4>

            {loadingRelated ? (
              <div className="py-4 text-center text-xs text-slate-400 flex items-center justify-center gap-2">
                <Loader2 className="w-4 h-4 animate-spin text-indigo-500" />
                <span>Finding semantic connections...</span>
              </div>
            ) : related.length === 0 ? (
              <p className="text-xs text-slate-400 italic">No strongly related memories found yet.</p>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                {related.map((rel) => (
                  <div
                    key={rel.id}
                    onClick={() => onSelectMemory(rel)}
                    className="p-3 rounded-xl border border-slate-200/80 hover:border-indigo-300 hover:bg-indigo-50/30 cursor-pointer transition text-left group"
                  >
                    <span className="text-[10px] font-bold uppercase text-indigo-600 mb-1 block">
                      {rel.memory_type}
                    </span>
                    <h5 className="text-xs font-bold text-slate-800 truncate group-hover:text-indigo-600">
                      {rel.title}
                    </h5>
                    <p className="text-[11px] text-slate-500 line-clamp-2 mt-0.5">
                      {rel.content_snippet || rel.extracted_text}
                    </p>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Footer actions */}
        <div className="p-4 bg-slate-50 border-t border-slate-100 flex items-center justify-between">
          <button
            onClick={() => {
              if (confirm('Are you sure you want to delete this memory?')) {
                onDelete(memory.id);
                onClose();
              }
            }}
            className="text-xs font-semibold text-red-600 hover:bg-red-50 px-3 py-2 rounded-xl flex items-center gap-1.5 transition"
          >
            <Trash2 className="w-4 h-4" />
            <span>Delete Memory</span>
          </button>

          <button
            onClick={onClose}
            className="text-xs font-semibold bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 px-4 py-2 rounded-xl transition shadow-2xs"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
