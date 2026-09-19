'use client';

import React, { useState, useRef } from 'react';
import { X, Scan, UploadCloud, Loader2, AlertCircle } from 'lucide-react';
import { uploadFile } from '@/lib/api';
import { Memory } from '@/lib/types';

interface ScanTextModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (memory: Memory) => void;
}

export default function ScanTextModal({ isOpen, onClose, onSuccess }: ScanTextModalProps) {
  const [file, setFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [title, setTitle] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!isOpen) return null;

  const handleSelectFile = (selected: File) => {
    setFile(selected);
    setPreviewUrl(URL.createObjectURL(selected));
    if (!title) {
      setTitle(selected.name.replace(/\.[^/.]+$/, ''));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!file) {
      setError('Please select an image to scan');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const mem = await uploadFile(file, title.trim() || undefined, 'scan,ocr');
      onSuccess(mem);
      onClose();
      setFile(null);
      setPreviewUrl(null);
      setTitle('');
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to scan image OCR');
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
          <div className="p-2 bg-purple-50 text-purple-600 rounded-xl">
            <Scan className="w-5 h-5" />
          </div>
          <h3 className="text-xl font-bold text-slate-900">Scan Text (OCR)</h3>
        </div>
        <p className="text-xs text-slate-500 mb-4 pl-10">
          Upload any screenshot, whiteboard photo, or scanned document to extract and index readable text.
        </p>

        {error && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-700 rounded-xl text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div
            onClick={() => fileInputRef.current?.click()}
            className="border-2 border-dashed border-purple-200 hover:border-purple-400 bg-purple-50/30 rounded-2xl p-5 text-center cursor-pointer transition"
          >
            <input
              ref={fileInputRef}
              type="file"
              onChange={(e) => e.target.files?.[0] && handleSelectFile(e.target.files[0])}
              accept="image/*"
              className="hidden"
            />
            {previewUrl ? (
              <div className="flex flex-col items-center">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={previewUrl} alt="Preview" className="max-h-36 rounded-lg object-contain shadow-xs mb-2" />
                <span className="text-xs font-semibold text-purple-700">Click to choose a different image</span>
              </div>
            ) : (
              <div className="flex flex-col items-center">
                <UploadCloud className="w-8 h-8 text-purple-500 mb-1.5" />
                <span className="text-sm font-semibold text-slate-700">Select Image to OCR</span>
                <span className="text-xs text-slate-400 mt-1">PNG, JPG, WEBP screenshots or photos</span>
              </div>
            )}
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1.5">Memory Label / Title</label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. Schedule Screenshot, DAA Notes"
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 focus:border-purple-500 focus:ring-2 focus:ring-purple-100 text-sm outline-none transition"
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
              disabled={loading || !file}
              className="bg-purple-600 hover:bg-purple-700 active:bg-purple-800 disabled:opacity-50 text-white text-sm font-semibold px-5 py-2.5 rounded-xl shadow-xs flex items-center gap-2 transition"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Processing OCR...</span>
                </>
              ) : (
                <span>Scan & Save</span>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
