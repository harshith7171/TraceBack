'use client';

import React, { useState } from 'react';
import { X, Link2, Loader2, AlertCircle, Globe } from 'lucide-react';
import { saveLink } from '@/lib/api';
import { Memory } from '@/lib/types';

interface SaveLinkModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (memory: Memory) => void;
}

export default function SaveLinkModal({ isOpen, onClose, onSuccess }: SaveLinkModalProps) {
  const [url, setUrl] = useState('');
  const [customTitle, setCustomTitle] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!url.trim()) {
      setError('Please enter a valid website URL');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const mem = await saveLink(url.trim(), customTitle.trim() || undefined);
      onSuccess(mem);
      onClose();
      setUrl('');
      setCustomTitle('');
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to fetch and save webpage');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-xs p-4 animate-in fade-in">
      <div className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 relative">
        <button
          onClick={onClose}
          className="absolute top-5 right-5 p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-full transition"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="flex items-center gap-2.5 mb-1">
          <div className="p-2 bg-rose-50 text-rose-500 rounded-xl">
            <Link2 className="w-5 h-5" />
          </div>
          <h3 className="text-xl font-bold text-slate-900">Save Webpage Link</h3>
        </div>
        <p className="text-xs text-slate-500 mb-4 pl-10">
          Paste any website URL. TraceBack will scrape the article text, metadata, and index it into memory.
        </p>

        {error && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-700 rounded-xl text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1.5">Webpage URL</label>
            <div className="flex items-center gap-2 px-3.5 py-2.5 rounded-xl border border-slate-200 focus-within:border-rose-500 focus-within:ring-2 focus-within:ring-rose-100 transition">
              <Globe className="w-4 h-4 text-slate-400 shrink-0" />
              <input
                type="text"
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                placeholder="https://openai.com/blog or any article"
                className="w-full text-sm outline-none bg-transparent"
                autoFocus
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1.5">Custom Title (optional)</label>
            <input
              type="text"
              value={customTitle}
              onChange={(e) => setCustomTitle(e.target.value)}
              placeholder="Leave empty to auto-detect page title"
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 focus:border-rose-500 focus:ring-2 focus:ring-rose-100 text-sm outline-none transition"
            />
          </div>

          <div className="flex items-center justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-sm font-semibold text-slate-600 hover:bg-slate-100 rounded-xl transition"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading || !url.trim()}
              className="bg-rose-500 hover:bg-rose-600 active:bg-rose-700 disabled:opacity-50 text-white text-sm font-semibold px-5 py-2.5 rounded-xl shadow-xs flex items-center gap-2 transition"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Scraping & Indexing...</span>
                </>
              ) : (
                <span>Save Webpage</span>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
