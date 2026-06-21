import React, { useMemo, useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Search, ZoomIn, ZoomOut, Focus, GitFork, ArrowRight } from 'lucide-react';
import { NewsItem, HierarchyLevel, HIERARCHY_ORDER } from '../types';
import { layoutHierarchicalNews, MindMapNode } from '../utils/layout';

interface MindMapProps {
  newsItems: NewsItem[];
  activeNewsId: string | null;
  onSelectNode: (itemId: string) => void;
}

const LEVEL_COLORS: Record<HierarchyLevel, { bg: string; text: string; border: string; glow: string }> = {
  Global: { bg: 'bg-red-50', text: 'text-red-800', border: 'border-red-300', glow: 'shadow-red-500/10' },
  Geography: { bg: 'bg-stone-100', text: 'text-stone-800', border: 'border-stone-300', glow: 'shadow-stone-500/10' },
  Country: { bg: 'bg-amber-50', text: 'text-amber-800', border: 'border-amber-300', glow: 'shadow-amber-500/10' },
  Sector: { bg: 'bg-blue-50', text: 'text-blue-800', border: 'border-blue-300', glow: 'shadow-blue-500/10' },
  Industry: { bg: 'bg-emerald-50', text: 'text-emerald-800', border: 'border-emerald-300', glow: 'shadow-emerald-500/10' },
  Stock: { bg: 'bg-purple-50', text: 'text-purple-800', border: 'border-purple-300', glow: 'shadow-purple-500/10' }
};

export default function MindMap({ newsItems, activeNewsId, onSelectNode }: MindMapProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [zoomLevel, setZoomLevel] = useState(1);
  const [hoveredNode, setHoveredNode] = useState<MindMapNode | null>(null);

  // Compute layout structures
  const layout = useMemo(() => {
    return layoutHierarchicalNews(newsItems, 1200, 650);
  }, [newsItems]);

  const activeNode = useMemo(() => {
    return layout.nodes.find(n => n.id === activeNewsId) || null;
  }, [layout.nodes, activeNewsId]);

  // Highlight matches for search query
  const searchMatches = useMemo(() => {
    if (!searchQuery.trim()) return new Set<string>();
    const query = searchQuery.toLowerCase();
    const set = new Set<string>();
    layout.nodes.forEach(node => {
      if (
        node.item.title.toLowerCase().includes(query) ||
        node.item.categoryName.toLowerCase().includes(query) ||
        node.item.summary.toLowerCase().includes(query) ||
        node.item.level.toLowerCase().includes(query)
      ) {
        set.add(node.id);
      }
    });
    return set;
  }, [layout.nodes, searchQuery]);

  // Center view on active node
  const handleRecenter = () => {
    setZoomLevel(1);
  };

  return (
    <div id="mind-map-view" className="bg-[#FAF9F5] border border-stone-300 rounded-xl overflow-hidden shadow-md flex flex-col h-full relative group text-[#1A1A1A]">
      {/* Mind Map Header */}
      <div className="p-4 bg-stone-100 border-b border-stone-200 flex flex-wrap gap-3 items-center justify-between z-10">
        <div className="flex items-center gap-2">
          <GitFork className="w-5 h-5 text-red-700" />
          <div>
            <h3 className="text-xs uppercase font-extrabold tracking-widest text-[#1A1A1A]">Hierarchical News Map</h3>
            <p className="text-[10px] text-stone-600 font-mono">Select nodes to pivot visual perspective</p>
          </div>
        </div>

        {/* Search inside mind map */}
        <div className="flex items-center gap-2">
          <div className="relative">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-stone-400" />
            <input
              type="text"
              placeholder="Search news..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-8 pr-3 py-1 text-xs bg-white border border-stone-300 rounded text-stone-950 placeholder-stone-400 focus:outline-none focus:border-stone-500 w-44 transition-all font-mono"
            />
          </div>

          {/* Controls */}
          <button
            onClick={() => setZoomLevel(z => Math.max(0.6, z - 0.15))}
            className="p-1 px-1.5 bg-white border border-stone-300 hover:bg-stone-50 text-stone-600 hover:text-stone-900 rounded text-xs transition-colors cursor-pointer"
            title="Zoom Out"
          >
            <ZoomOut className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={() => setZoomLevel(z => Math.min(1.5, z + 0.15))}
            className="p-1 px-1.5 bg-white border border-stone-300 hover:bg-stone-50 text-stone-600 hover:text-stone-900 rounded text-xs transition-colors cursor-pointer"
            title="Zoom In"
          >
            <ZoomIn className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={handleRecenter}
            className="p-1 px-1.5 bg-white border border-stone-300 hover:bg-stone-50 text-stone-600 hover:text-stone-900 rounded text-xs transition-colors cursor-pointer"
            title="Reset Zoom"
          >
            <Focus className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Mind Map Path Column Titles */}
      <div className="hidden md:grid grid-cols-6 text-center py-2 px-12 bg-stone-50 text-[9px] font-bold text-stone-500 border-b border-stone-200 uppercase tracking-widest pointer-events-none z-10 font-mono">
        {HIERARCHY_ORDER.map((level) => (
          <div key={level} className="flex items-center justify-center gap-1">
            <span>{level}</span>
          </div>
        ))}
      </div>

      {/* SVG Container viewport */}
      <div className="flex-1 relative overflow-auto">
        {newsItems.length === 0 ? (
          <div className="absolute inset-0 flex flex-col items-center justify-center text-stone-500 p-6 font-serif italic">
            <p className="text-sm">No hierarchical news data to map</p>
          </div>
        ) : (
          <div
            className="origin-top-left transition-transform duration-200 ease-out"
            style={{
              transform: `scale(${zoomLevel})`,
              transformOrigin: 'top left',
              width: `${layout.width}px`,
              height: `${layout.height}px`
            }}
          >
            <svg
              width={layout.width}
              height={layout.height}
              className="absolute inset-0 select-none"
            >
              {/* Grid Background */}
              <defs>
                <pattern id="grid" width="40" height="40" patternUnits="userSpaceOnUse">
                  <path d="M 40 0 L 0 0 0 40" fill="none" stroke="rgba(26, 26, 26, 0.04)" strokeWidth="1" />
                </pattern>
              </defs>
              <rect width="100%" height="100%" fill="url(#grid)" />

              {/* Draw Connector pathways */}
              <g id="map-links">
                {layout.links.map((link) => {
                  const isActivePath = activeNode && (activeNode.id === link.sourceId || activeNode.id === link.targetId || activeNode.item.parentId === link.sourceId);
                  return (
                    <path
                      key={link.id}
                      d={link.pathData}
                      fill="none"
                      stroke={isActivePath ? '#B91C1C' : 'rgba(120, 113, 108, 0.35)'}
                      strokeWidth={isActivePath ? 2.5 : 1.22}
                      className="transition-colors duration-300"
                      strokeDasharray={isActivePath ? 'none' : '3 3'}
                    />
                  );
                })}
              </g>

              {/* Nodes Layout */}
              <g id="map-nodes">
                {layout.nodes.map((node) => {
                  const colors = LEVEL_COLORS[node.item.level];
                  const isActive = node.id === activeNewsId;
                  const isMatch = searchQuery && searchMatches.has(node.id);
                  const isSemiTransparent = searchQuery && !isMatch;

                  return (
                    <g
                      key={node.id}
                      className="cursor-pointer"
                      onClick={() => onSelectNode(node.id)}
                      onMouseEnter={() => setHoveredNode(node)}
                      onMouseLeave={() => setHoveredNode(null)}
                    >
                      {/* Aura glowing background on Active / Matching */}
                      {(isActive || isMatch) && (
                        <circle
                          cx={node.x}
                          cy={node.y}
                          r={65}
                          className="fill-none stroke-current text-red-700/10"
                          strokeWidth={isActive ? 6 : 3}
                          strokeDasharray="3 3"
                        />
                      )}

                      {/* Connection point circles */}
                      <circle
                        cx={node.x}
                        cy={node.y}
                        r={isActive ? 6 : 4.5}
                        className={`${isActive ? 'fill-red-700 stroke-stone-900' : 'fill-stone-400'} stroke-2`}
                      />

                      {/* ForeignObject allows rendering of rich HTML/Tailwind inside SVG */}
                      <foreignObject
                        x={node.x - 70}
                        y={node.y - 45}
                        width={140}
                        height={90}
                        className="overflow-visible"
                      >
                        <div
                          className={`w-32 mx-auto rounded border p-2 text-center transition-all duration-350 select-none flex flex-col justify-between h-[75px] ${
                            isActive
                              ? `bg-white border-red-700 ring-2 ring-red-700/20 scale-105 shadow-md`
                              : isSemiTransparent
                              ? 'bg-stone-50/20 border-dotted border-stone-250 text-stone-400 opacity-30 shadow-none'
                              : isMatch
                              ? 'bg-white border-amber-600 shadow-sm scale-105'
                              : 'bg-white border-stone-300 hover:border-stone-500 shadow-sm hover:scale-[1.03]'
                          }`}
                        >
                          <div>
                            {/* Level Category Tag */}
                            <span
                              className={`text-[8px] font-extrabold tracking-wider uppercase px-1.5 py-0.5 rounded ${colors.text} ${colors.bg} border border-[#DEDBD5]/40`}
                            >
                              {node.item.level}
                            </span>
                            {/* Category Label Name */}
                            <div className="font-bold text-[10px] text-stone-900 truncate mt-1">
                              {node.item.categoryName}
                            </div>
                          </div>

                          {/* Clipped mini heading */}
                          <div className="text-[9px] text-stone-600 font-serif line-clamp-2 leading-tight italic">
                            {node.item.title}
                          </div>
                        </div>
                      </foreignObject>
                    </g>
                  );
                })}
              </g>
            </svg>
          </div>
        )}
      </div>

      {/* Floating Hover Card Detail HUD inside map */}
      <AnimatePresence>
        {hoveredNode && (
          <motion.div
            initial={{ opacity: 0, y: 10, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 10, scale: 0.95 }}
            className="absolute bottom-4 left-4 right-4 md:left-auto md:right-4 md:w-80 p-4 bg-white border border-stone-300 rounded-lg shadow-lg z-20 pointer-events-none"
          >
            <div className="flex items-center justify-between mb-1.5 font-mono">
              <span className={`text-[9px] font-extrabold uppercase tracking-wide px-2 py-0.5 rounded ${LEVEL_COLORS[hoveredNode.item.level].text} ${LEVEL_COLORS[hoveredNode.item.level].bg}`}>
                {hoveredNode.item.level}
              </span>
              <span className="text-[9px] font-semibold text-stone-500">Node: {hoveredNode.id}</span>
            </div>
            <h4 className="text-xs font-bold font-serif text-stone-900 mb-1 leading-snug">
              {hoveredNode.item.categoryName}: {hoveredNode.item.title}
            </h4>
            <p className="text-[10px] leading-relaxed text-stone-700 font-serif italic border-l-2 border-red-700 pl-2">
              {hoveredNode.item.summary}
            </p>
            <div className="mt-2.5 pt-2 border-t border-stone-200 flex items-center justify-between text-[9px] text-stone-500 font-mono">
              <span>Source: {hoveredNode.item.source}</span>
              <span className="flex items-center gap-1 text-red-700 font-bold uppercase tracking-wider">
                View Node <ArrowRight className="w-2.5 h-2.5" />
              </span>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
