'use client';

import React from 'react';
import { ExternalLink, ArrowRight } from 'lucide-react';

interface KnowledgeMapWidgetProps {
  onOpenFullMap: () => void;
  onSelectNode?: (label: string) => void;
}

export default function KnowledgeMapWidget({
  onOpenFullMap,
  onSelectNode,
}: KnowledgeMapWidgetProps) {
  // Radial layout nodes matching the exact visual layout from the screenshot
  const nodes = [
    { id: 'resume', label: 'Resume', x: 75, y: 55, bg: '#FEE2E2', border: '#FECACA', text: '#991B1B' },
    { id: 'cover', label: 'Cover Letter', x: 195, y: 55, bg: '#DCFCE7', border: '#BBF7D0', text: '#166534' },
    { id: 'tips', label: 'Interview Tips', x: 45, y: 135, bg: '#E0E7FF', border: '#C7D2FE', text: '#3730A3' },
    { id: 'prep', label: 'Preparation', x: 75, y: 215, bg: '#E0F2FE', border: '#BAE6FD', text: '#0369A1' },
    { id: 'deadlines', label: 'Deadlines', x: 195, y: 215, bg: '#FFEDD5', border: '#FED7AA', text: '#9A3412' },
    { id: 'companies', label: 'Companies', x: 225, y: 135, bg: '#F3E8FF', border: '#E9D5FF', text: '#6B21A8' },
  ];

  const centerNode = {
    id: 'internship',
    label: 'Internship',
    x: 135,
    y: 135,
    bg: '#3B82F6',
    border: '#2563EB',
    text: '#FFFFFF',
  };

  return (
    <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-xs mb-6 select-none">
      {/* Header */}
      <div className="flex items-center justify-between mb-2">
        <h4 className="text-base font-bold text-slate-900">Knowledge Map</h4>
        <button
          onClick={onOpenFullMap}
          className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition"
          aria-label="Expand knowledge map"
        >
          <ExternalLink className="w-4 h-4" />
        </button>
      </div>

      {/* Interactive Radial Graph */}
      <div className="relative w-full h-[270px] flex items-center justify-center my-2">
        <svg viewBox="0 0 270 270" className="w-full h-full">
          {/* Connector lines from center to satellite nodes */}
          {nodes.map((node) => (
            <line
              key={`line-${node.id}`}
              x1={centerNode.x}
              y1={centerNode.y}
              x2={node.x}
              y2={node.y}
              stroke="#94A3B8"
              strokeWidth="1.5"
              strokeDasharray="3 3"
              className="opacity-70"
            />
          ))}

          {/* Satellite Nodes */}
          {nodes.map((node) => (
            <g
              key={`node-${node.id}`}
              onClick={() => onSelectNode?.(node.label)}
              className="cursor-pointer group"
            >
              <circle
                cx={node.x}
                cy={node.y}
                r="28"
                fill={node.bg}
                stroke={node.border}
                strokeWidth="1.5"
                className="transition-transform duration-200 group-hover:scale-110"
              />
              <text
                x={node.x}
                y={node.y}
                textAnchor="middle"
                dominantBaseline="central"
                fill={node.text}
                fontSize="9.5"
                fontWeight="600"
                fontFamily="sans-serif"
                className="pointer-events-none select-none"
              >
                {node.label.includes(' ') ? (
                  <>
                    <tspan x={node.x} dy="-5">{node.label.split(' ')[0]}</tspan>
                    <tspan x={node.x} dy="12">{node.label.split(' ')[1]}</tspan>
                  </>
                ) : (
                  node.label
                )}
              </text>
            </g>
          ))}

          {/* Central Hub Node */}
          <g
            onClick={() => onSelectNode?.(centerNode.label)}
            className="cursor-pointer group"
          >
            <circle
              cx={centerNode.x}
              cy={centerNode.y}
              r="34"
              fill={centerNode.bg}
              stroke={centerNode.border}
              strokeWidth="2.5"
              className="shadow-md transition-transform duration-200 group-hover:scale-105"
            />
            <text
              x={centerNode.x}
              y={centerNode.y}
              textAnchor="middle"
              dominantBaseline="central"
              fill={centerNode.text}
              fontSize="11"
              fontWeight="bold"
              fontFamily="sans-serif"
              className="pointer-events-none select-none"
            >
              {centerNode.label}
            </text>
          </g>
        </svg>
      </div>

      {/* Footer Info */}
      <div className="pt-2 border-t border-slate-100">
        <p className="text-xs text-slate-500 mb-2">See how your information is connected.</p>
        <button
          onClick={onOpenFullMap}
          className="text-xs font-bold text-blue-600 hover:text-blue-700 flex items-center gap-1 group transition"
        >
          <span>Open Knowledge Map</span>
          <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
        </button>
      </div>
    </div>
  );
}
