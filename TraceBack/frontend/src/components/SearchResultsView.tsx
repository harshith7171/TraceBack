'use client';

import React from 'react';
import { SearchResultItem, Memory } from '@/lib/types';
import { ArrowLeft, Sparkles, ExternalLink, Calendar, Star } from 'lucide-react';

interface SearchResultsViewProps {
  query: string;
  results: SearchResultItem[];
  onBack: () => void;
  onOpenDetail: (memory: Memory) => void;
  onToggleFavorite: (id: string) => void;
}

export default function SearchResultsView({
  query,
  results,
  onBack,
  onOpenDetail,
  onToggleFavorite,
}: SearchResultsViewProps) {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <button
            onClick={onBack}
            className="p-2 text-slate-500 hover:text-slate-800 hover:bg-slate-100 rounded-full transition"
            title="Back to Dashboard"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <h2 className="text-xl font-bold text-slate-900">
              Search Results
            </h2>
            <p className="text-xs text-slate-500">
              Found {results.length} memories matching <strong className="text-slate-800 font-semibold">&ldquo;{query}&rdquo;</strong>
            </p>
          </div>
        </div>

        <button
          onClick={onBack}
          className="text-xs font-semibold text-blue-600 hover:text-blue-700 hover:underline"
        >
          Clear search
        </button>
      </div>

      {/* Results List */}
      {results.length === 0 ? (
        <div className="bg-white rounded-3xl border border-slate-200 p-12 text-center">
          <div className="w-12 h-12 rounded-full bg-blue-50 text-blue-500 flex items-center justify-center mx-auto mb-3">
            <Sparkles className="w-6 h-6" />
          </div>
          <h3 className="text-base font-bold text-slate-800 mb-1">No matching memories found</h3>
          <p className="text-xs text-slate-500 max-w-sm mx-auto mb-4">
            Try searching with different keywords, or upload files and screenshots to expand your memory engine.
          </p>
          <button
            onClick={onBack}
            className="text-xs bg-blue-600 hover:bg-blue-700 text-white font-semibold px-4 py-2 rounded-xl transition"
          >
            Return to Dashboard
          </button>
        </div>
      ) : (
        <div className="space-y-4">
          {results.map((item) => {
            const { memory, similarity_score, matched_snippet, why_matched } = item;
            const matchPercent = Math.round(similarity_score * 100);

            return (
              <div
                key={memory.id}
                onClick={() => onOpenDetail(memory)}
                className="bg-white rounded-2xl border border-slate-200/90 p-5 hover:shadow-md hover:border-blue-300 transition-all cursor-pointer group"
              >
                <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3 mb-2">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-full bg-blue-50 text-blue-700 border border-blue-100">
                      {memory.memory_type}
                    </span>
                    <h3 className="font-bold text-slate-900 text-base group-hover:text-blue-600 transition-colors">
                      {memory.title}
                    </h3>
                  </div>

                  {/* Similarity Badge */}
                  <div className="flex items-center gap-2 shrink-0">
                    <span
                      className={`text-xs font-bold px-3 py-1 rounded-full flex items-center gap-1.5 ${
                        matchPercent >= 70
                          ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                          : matchPercent >= 45
                          ? 'bg-blue-50 text-blue-700 border border-blue-200'
                          : 'bg-slate-50 text-slate-600 border border-slate-200'
                      }`}
                    >
                      <Sparkles className="w-3 h-3" />
                      <span>{matchPercent}% Match</span>
                    </span>

                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onToggleFavorite(memory.id);
                      }}
                      className="p-1.5 text-slate-400 hover:text-amber-500 rounded-full hover:bg-slate-100 transition"
                    >
                      <Star className={`w-4 h-4 ${memory.is_favorite ? 'fill-amber-400 text-amber-500' : ''}`} />
                    </button>
                  </div>
                </div>

                {/* Why it matched explanation */}
                <div className="mb-3 px-3 py-2 bg-indigo-50/60 border border-indigo-100 rounded-xl text-xs text-indigo-900 flex items-center gap-2">
                  <Sparkles className="w-3.5 h-3.5 text-indigo-600 shrink-0" />
                  <span className="font-medium">{why_matched}</span>
                </div>

                {/* Matched excerpt */}
                <p className="text-xs text-slate-600 leading-relaxed bg-slate-50 p-3 rounded-xl border border-slate-100 font-sans mb-3">
                  &ldquo;{matched_snippet}&rdquo;
                </p>

                {/* Metadata & Source */}
                <div className="flex items-center justify-between text-xs text-slate-400 pt-1">
                  <span className="flex items-center gap-1">
                    <Calendar className="w-3.5 h-3.5" />
                    {new Date(memory.created_at).toLocaleDateString('en-US', {
                      month: 'short',
                      day: 'numeric',
                      year: 'numeric',
                    })}
                  </span>

                  {memory.source_url && (
                    <a
                      href={memory.source_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      onClick={(e) => e.stopPropagation()}
                      className="text-blue-600 hover:underline flex items-center gap-1 font-medium"
                    >
                      <span>{memory.source_url}</span>
                      <ExternalLink className="w-3 h-3" />
                    </a>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
