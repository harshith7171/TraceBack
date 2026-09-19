'use client';

import React, { useEffect, useState } from 'react';
import { X, Network } from 'lucide-react';
import { fetchKnowledgeGraph } from '@/lib/api';
import { KnowledgeGraphResponse } from '@/lib/types';

interface KnowledgeMapModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectKeyword?: (keyword: string) => void;
}

export default function KnowledgeMapModal({
  isOpen,
  onClose,
  onSelectKeyword,
}: KnowledgeMapModalProps) {
  const [graph, setGraph] = useState<KnowledgeGraphResponse | null>(null);

  useEffect(() => {
    if (isOpen) {
      fetchKnowledgeGraph()
        .then(setGraph)
        .catch(console.error);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const nodeColors: Record<string, { fill: string; stroke: string; text: string }> = {
    screenshot: { fill: '#EDE9FE', stroke: '#DDD6FE', text: '#5B21B6' },
    pdf: { fill: '#FEE2E2', stroke: '#FECACA', text: '#991B1B' },
    link: { fill: '#E0F2FE', stroke: '#BAE6FD', text: '#0369A1' },
    image: { fill: '#FEF3C7', stroke: '#FDE68A', text: '#92400E' },
    note: { fill: '#DCFCE7', stroke: '#BBF7D0', text: '#166534' },
    hub: { fill: '#3B82F6', stroke: '#2563EB', text: '#FFFFFF' },
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4 animate-in fade-in">
      <div className="bg-white rounded-3xl max-w-4xl w-full h-[85vh] flex flex-col shadow-2xl border border-slate-200 overflow-hidden relative">
        {/* Header */}
        <div className="p-6 pb-4 border-b border-slate-100 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-indigo-50 text-indigo-600 rounded-xl">
              <Network className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-xl font-bold text-slate-900">Knowledge Map Explorer</h3>
              <p className="text-xs text-slate-500">
                Visualizing associative memory connections discovered across your documents.
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-full transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Graph Canvas */}
        <div className="flex-1 bg-slate-50 relative overflow-hidden flex items-center justify-center p-4">
          <div className="w-full h-full max-w-2xl max-h-[500px] bg-white rounded-2xl border border-slate-200 shadow-inner relative flex items-center justify-center p-6">
            <svg viewBox="0 0 600 450" className="w-full h-full">
              {/* Radial or organic layout */}
              {graph?.edges.map((edge, idx) => {
                // Calculate pseudo layout positions
                const sourceIdx = graph.nodes.findIndex((n) => n.id === edge.source);
                const targetIdx = graph.nodes.findIndex((n) => n.id === edge.target);
                const total = graph.nodes.length;
                
                const angle1 = (sourceIdx / total) * 2 * Math.PI;
                const angle2 = (targetIdx / total) * 2 * Math.PI;
                const r = 160;
                
                const x1 = 300 + (sourceIdx === 0 ? 0 : r * Math.cos(angle1));
                const y1 = 225 + (sourceIdx === 0 ? 0 : r * Math.sin(angle1));
                const x2 = 300 + (targetIdx === 0 ? 0 : r * Math.cos(angle2));
                const y2 = 225 + (targetIdx === 0 ? 0 : r * Math.sin(angle2));

                return (
                  <line
                    key={`edge-${idx}`}
                    x1={x1}
                    y1={y1}
                    x2={x2}
                    y2={y2}
                    stroke="#CBD5E1"
                    strokeWidth={Math.max(1, edge.value * 3)}
                    strokeDasharray="4 2"
                    className="opacity-80"
                  />
                );
              })}

              {/* Nodes */}
              {graph?.nodes.map((node, idx) => {
                const total = graph.nodes.length;
                const angle = (idx / total) * 2 * Math.PI;
                const r = idx === 0 ? 0 : 160;
                const cx = 300 + r * Math.cos(angle);
                const cy = 225 + r * Math.sin(angle);
                const colors = nodeColors[node.memory_type] || nodeColors.hub;

                return (
                  <g
                    key={node.id}
                    onClick={() => {
                      if (onSelectKeyword) {
                        onSelectKeyword(node.label);
                        onClose();
                      }
                    }}
                    className="cursor-pointer group"
                  >
                    <circle
                      cx={cx}
                      cy={cy}
                      r={node.val ? node.val * 1.6 : 24}
                      fill={colors.fill}
                      stroke={colors.stroke}
                      strokeWidth="2"
                      className="transition-transform group-hover:scale-110 shadow-xs"
                    />
                    <text
                      x={cx}
                      y={cy}
                      textAnchor="middle"
                      dominantBaseline="central"
                      fill={colors.text}
                      fontSize={idx === 0 ? '12' : '10'}
                      fontWeight="bold"
                      fontFamily="sans-serif"
                      className="pointer-events-none select-none"
                    >
                      {node.label}
                    </text>
                  </g>
                );
              })}
            </svg>
          </div>
        </div>

        {/* Footer controls */}
        <div className="p-4 bg-white border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
          <div className="flex items-center gap-4">
            <span className="flex items-center gap-1.5 font-medium">
              <span className="w-2.5 h-2.5 rounded-full bg-blue-500 inline-block" /> Hubs
            </span>
            <span className="flex items-center gap-1.5 font-medium">
              <span className="w-2.5 h-2.5 rounded-full bg-rose-400 inline-block" /> PDFs
            </span>
            <span className="flex items-center gap-1.5 font-medium">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 inline-block" /> Notes
            </span>
            <span className="flex items-center gap-1.5 font-medium">
              <span className="w-2.5 h-2.5 rounded-full bg-purple-400 inline-block" /> Screenshots
            </span>
          </div>

          <span className="italic">Click any node to search memories</span>
        </div>
      </div>
    </div>
  );
}
