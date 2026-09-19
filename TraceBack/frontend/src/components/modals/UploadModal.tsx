'use client';

import React, { useState, useRef } from 'react';
import { X, UploadCloud, CheckCircle2, AlertCircle, Loader2 } from 'lucide-react';
import { uploadFile } from '@/lib/api';
import { Memory } from '@/lib/types';

interface UploadModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (memory: Memory) => void;
}

export default function UploadModal({ isOpen, onClose, onSuccess }: UploadModalProps) {
  const [file, setFile] = useState<File | null>(null);
  const [title, setTitle] = useState('');
  const [tags, setTags] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [dragOver, setDragOver] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!isOpen) return null;

  const handleFileDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      const selected = e.dataTransfer.files[0];
      setFile(selected);
      if (!title) {
        setTitle(selected.name.replace(/\.[^/.]+$/, ''));
      }
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const selected = e.target.files[0];
      setFile(selected);
      if (!title) {
        setTitle(selected.name.replace(/\.[^/.]+$/, ''));
      }
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!file) {
      setError('Please select a file to upload');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const mem = await uploadFile(file, title.trim() || undefined, tags.trim() || undefined);
      onSuccess(mem);
      onClose();
      // Reset
      setFile(null);
      setTitle('');
      setTags('');
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to upload and process file');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-xs p-4 animate-in fade-in">
      <div className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 relative">
        {/* Close button */}
        <button
          onClick={onClose}
          className="absolute top-5 right-5 p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-full transition"
        >
          <X className="w-5 h-5" />
        </button>

        <h3 className="text-xl font-bold text-slate-900 mb-1">Upload to Memory</h3>
        <p className="text-xs text-slate-500 mb-5">
          Upload screenshots, documents, or photos. OCR and vector embeddings will be extracted automatically.
        </p>

        {error && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-700 rounded-xl text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Drop area */}
          <div
            onDragOver={(e) => {
              e.preventDefault();
              setDragOver(true);
            }}
            onDragLeave={() => setDragOver(false)}
            onDrop={handleFileDrop}
            onClick={() => fileInputRef.current?.click()}
            className={`border-2 border-dashed rounded-2xl p-6 text-center cursor-pointer transition-all ${
              dragOver
                ? 'border-blue-500 bg-blue-50/50'
                : file
                ? 'border-emerald-300 bg-emerald-50/30'
                : 'border-slate-200 hover:border-blue-400 bg-slate-50/50'
            }`}
          >
            <input
              ref={fileInputRef}
              type="file"
              onChange={handleFileSelect}
              accept=".pdf,.png,.jpg,.jpeg,.webp,.pptx,.ppt"
              className="hidden"
            />
            {file ? (
              <div className="flex flex-col items-center">
                <CheckCircle2 className="w-9 h-9 text-emerald-500 mb-2" />
                <span className="font-semibold text-slate-800 text-sm truncate max-w-xs">{file.name}</span>
                <span className="text-xs text-slate-400 mt-0.5">{(file.size / 1024).toFixed(1)} KB — Click to change</span>
              </div>
            ) : (
              <div className="flex flex-col items-center">
                <div className="p-3 bg-blue-50 text-blue-600 rounded-2xl mb-2">
                  <UploadCloud className="w-7 h-7" />
                </div>
                <span className="font-semibold text-slate-700 text-sm">
                  Drag & drop or <span className="text-blue-600 underline">browse</span>
                </span>
                <span className="text-xs text-slate-400 mt-1">
                  Supports PDF, PPTX, PPT, PNG, JPG, WEBP
                </span>
                <span className="text-[11px] text-indigo-600 font-medium mt-1.5 bg-indigo-50 px-2.5 py-0.5 rounded-full">
                  ⚡ Scans text inside embedded images & slides (Deep OCR)
                </span>
              </div>
            )}
          </div>

          {/* Title */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1.5">Title / Memory Name</label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. Internship Portal or ML Notes"
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-100 text-sm outline-none transition"
            />
          </div>

          {/* Tags */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1.5">Tags (optional)</label>
            <input
              type="text"
              value={tags}
              onChange={(e) => setTags(e.target.value)}
              placeholder="e.g. career, college, research"
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-100 text-sm outline-none transition"
            />
          </div>

          {/* Submit */}
          <div className="flex items-center justify-end gap-3 pt-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-sm font-semibold text-slate-600 hover:bg-slate-100 rounded-xl transition"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading || !file}
              className="bg-blue-600 hover:bg-blue-700 active:bg-blue-800 disabled:opacity-50 text-white text-sm font-semibold px-5 py-2.5 rounded-xl shadow-xs flex items-center gap-2 transition"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Extracting & Indexing...</span>
                </>
              ) : (
                <span>Upload & Extract</span>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
