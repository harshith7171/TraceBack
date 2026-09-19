'use client';

import React from 'react';
import { FileUp, FileText, Link2, Scan } from 'lucide-react';

interface ActionCardsProps {
  onUploadFile: () => void;
  onAddNote: () => void;
  onSaveLink: () => void;
  onScanText: () => void;
}

export default function ActionCards({
  onUploadFile,
  onAddNote,
  onSaveLink,
  onScanText,
}: ActionCardsProps) {
  const actions = [
    {
      id: 'upload',
      title: 'Upload File',
      subtitle: 'PDF, images, docs, etc.',
      icon: FileUp,
      bg: 'bg-blue-50/80 hover:bg-blue-50',
      iconBg: 'bg-blue-100 text-blue-600',
      border: 'border-blue-100',
      action: onUploadFile,
    },
    {
      id: 'note',
      title: 'Add Note',
      subtitle: 'Save your thoughts',
      icon: FileText,
      bg: 'bg-emerald-50/80 hover:bg-emerald-50',
      iconBg: 'bg-emerald-100 text-emerald-600',
      border: 'border-emerald-100',
      action: onAddNote,
    },
    {
      id: 'link',
      title: 'Save Link',
      subtitle: 'Store a webpage',
      icon: Link2,
      bg: 'bg-rose-50/80 hover:bg-rose-50',
      iconBg: 'bg-rose-100 text-rose-500',
      border: 'border-rose-100',
      action: onSaveLink,
    },
    {
      id: 'scan',
      title: 'Scan Text',
      subtitle: 'Extract text from image',
      icon: Scan,
      bg: 'bg-purple-50/80 hover:bg-purple-50',
      iconBg: 'bg-purple-100 text-purple-600',
      border: 'border-purple-100',
      action: onScanText,
    },
  ];

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-3.5 mb-8">
      {actions.map((item) => {
        const Icon = item.icon;
        return (
          <button
            key={item.id}
            onClick={item.action}
            type="button"
            className={`flex flex-col items-start p-4 rounded-2xl border ${item.border} ${item.bg} text-left transition-all duration-150 hover:shadow-xs hover:-translate-y-0.5 group`}
          >
            <div className={`p-2.5 rounded-xl ${item.iconBg} mb-3 group-hover:scale-105 transition-transform`}>
              <Icon className="w-5 h-5" />
            </div>
            <h4 className="text-sm font-bold text-slate-800 mb-0.5">{item.title}</h4>
            <p className="text-xs text-slate-500">{item.subtitle}</p>
          </button>
        );
      })}
    </div>
  );
}
