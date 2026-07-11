import React, { useMemo, useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { ZoomIn, ZoomOut, Compass, ArrowRight, Layers } from 'lucide-react';
import { NewsItem, HierarchyLevel, HIERARCHY_ORDER } from '../types';

interface VerticalHierarchyMapProps {
  newsItems: NewsItem[];
  activeNewsId: string | null;
  onSelectNode: (itemId: string) => void;
  heightClass?: string;
}

const LEVEL_COLORS: Record<HierarchyLevel, { bg: string; text: string; border: string; glow: string }> = {
  Global: { bg: 'bg-red-50 dark:bg-red-950/30', text: 'text-red-800 dark:text-red-300', border: 'border-red-300 dark:border-red-900', glow: 'shadow-red-500/10' },
  Geography: { bg: 'bg-stone-100 dark:bg-stone-800/50', text: 'text-stone-800 dark:text-stone-300', border: 'border-stone-300 dark:border-stone-700', glow: 'shadow-stone-500/10' },
  Country: { bg: 'bg-amber-50 dark:bg-amber-955/30', text: 'text-amber-800 dark:text-amber-300', border: 'border-amber-300 dark:border-amber-900', glow: 'shadow-amber-500/10' },
  Sector: { bg: 'bg-blue-50 dark:bg-blue-950/30', text: 'text-blue-800 dark:text-blue-300', border: 'border-blue-300 dark:border-blue-900', glow: 'shadow-blue-500/10' },
  Industry: { bg: 'bg-emerald-50 dark:bg-emerald-950/30', text: 'text-emerald-800 dark:text-emerald-300', border: 'border-emerald-300 dark:border-emerald-900', glow: 'shadow-emerald-500/10' },
  Stock: { bg: 'bg-purple-50 dark:bg-purple-950/30', text: 'text-purple-800 dark:text-purple-300', border: 'border-purple-300 dark:border-purple-900', glow: 'shadow-purple-500/10' }
};

interface VerticalNode {
  id: string;
  item: NewsItem;
  x: number; // calculated columns position
  y: number; // calculated row levels position
  levelIndex: number;
}

interface VerticalLink {
  id: string;
  sourceId: string;
  targetId: string;
  pathData: string;
}

export default function VerticalHierarchyMap({ newsItems, activeNewsId, onSelectNode, heightClass }: VerticalHierarchyMapProps) {
  const [zoomLevel, setZoomLevel] = useState(0.85);
  const [hoveredNode, setHoveredNode] = useState<VerticalNode | null>(null);

  // Compute a beautiful vertical-oriented layout specifically tailored to fit the Settings context
  const layout = useMemo(() => {
    if (newsItems.length === 0) {
      return { nodes: [], links: [], width: 700, height: 500 };
    }

    const nodeMap = new Map<string, NewsItem>();
    const childrenMap = new Map<string, string[]>();

    newsItems.forEach(item => {
      nodeMap.set(item.id, item);
      if (item.parentId) {
        const children = childrenMap.get(item.parentId) || [];
        children.push(item.id);
        childrenMap.set(item.parentId, children);
      }
    });

    // Roots
    const roots = newsItems.filter(item => {
      if (item.level === 'Global') return true;
      if (!item.parentId) return true;
      return !nodeMap.has(item.parentId);
    });

    const getLevelIndex = (level: HierarchyLevel): number => {
      const idx = HIERARCHY_ORDER.indexOf(level);
      return idx === -1 ? 0 : idx;
    };

    interface TempNode {
      id: string;
      item: NewsItem;
      children: TempNode[];
      levelIndex: number;
      x: number;
    }

    const buildSubtree = (item: NewsItem): TempNode => {
      const childrenIds = childrenMap.get(item.id) || [];
      const children = childrenIds
        .map(cid => nodeMap.get(cid)!)
        .filter(Boolean)
        .map(buildSubtree);
      
      return {
        id: item.id,
        item,
        children,
        levelIndex: getLevelIndex(item.level),
        x: 0
      };
    };

    const tempRoots = roots.map(buildSubtree);

    // Calculate X coordinate based on leaf allocation
    let leafCount = 0;
    const leaves: TempNode[] = [];

    const assignLeavesX = (node: TempNode) => {
      if (node.children.length === 0) {
        node.x = leafCount;
        leaves.push(node);
        leafCount++;
      } else {
        node.children.forEach(assignLeavesX);
        const firstX = node.children[0].x;
        const lastX = node.children[node.children.length - 1].x;
        node.x = (firstX + lastX) / 2;
      }
    };

    tempRoots.forEach(assignLeavesX);

    if (leafCount === 0) {
      let count = 0;
      const walk = (node: TempNode) => {
        node.x = count++;
        node.children.forEach(walk);
      };
      tempRoots.forEach(walk);
      leafCount = count;
    }

    // Set coordinates
    // Width and Height of the SVG
    // Top-to-Bottom:
    // Levels represent the Y axis (Global at Y=0 down to Stock at Y=5)
    // Leaf indices represent the X axis
    const paddingX = 85;
    const calculatedWidth = Math.max(760, leafCount * 135 + paddingX * 2);
    const colWidth = (calculatedWidth - paddingX * 2) / Math.max(1, leafCount - 1 || 1);

    const paddingY = 55;
    const levelHeight = 115;
    const calculatedHeight = paddingY * 2 + 5 * levelHeight;

    const flatNodes: VerticalNode[] = [];
    const flatLinks: VerticalLink[] = [];

    const fillCoordinates = (node: TempNode) => {
      // Y is proportional to levelIndex (Vertical top-down flow!)
      const y = paddingY + node.levelIndex * levelHeight;
      // X is based on leaf position
      const x = paddingX + node.x * colWidth;

      flatNodes.push({
        id: node.id,
        item: node.item,
        x,
        y,
        levelIndex: node.levelIndex
      });

      node.children.forEach(child => {
        const childY = paddingY + child.levelIndex * levelHeight;
        const childX = paddingX + child.x * colWidth;

        // Top-to-bottom bezier path connecting vertical layers
        const cpX1 = x;
        const cpY1 = y + levelHeight * 0.45;
        const cpX2 = childX;
        const cpY2 = childY - levelHeight * 0.45;
        const pathData = `M ${x} ${y} C ${cpX1} ${cpY1}, ${cpX2} ${cpY2}, ${childX} ${childY}`;

        flatLinks.push({
          id: `${node.id}->${child.id}`,
          sourceId: node.id,
          targetId: child.id,
          pathData
        });

        fillCoordinates(child);
      });
    };

    tempRoots.forEach(fillCoordinates);

    return {
      nodes: flatNodes,
      links: flatLinks,
      width: calculatedWidth,
      height: calculatedHeight
    };
  }, [newsItems]);

  const activeNode = useMemo(() => {
    return layout.nodes.find(n => n.id === activeNewsId) || null;
  }, [layout.nodes, activeNewsId]);

  // Compute active lineage pathway to highlight path from root to current node
  const activePathIds = useMemo(() => {
    const ids = new Set<string>();
    if (!activeNewsId || newsItems.length === 0) return ids;

    let currentId: string | null = activeNewsId;
    const nodeMap = new Map<string, NewsItem>();
    newsItems.forEach(item => nodeMap.set(item.id, item));

    while (currentId) {
      ids.add(currentId);
      const item = nodeMap.get(currentId);
      currentId = item ? item.parentId : null;
    }
    return ids;
  }, [activeNewsId, newsItems]);

  return (
    <div className={`bg-stone-50 dark:bg-stone-950/80 border border-stone-250 dark:border-stone-800 rounded-xl overflow-hidden flex flex-col ${heightClass || 'h-[520px]'} relative text-[#1A1A1A] dark:text-[#EAE5DF] font-sans`}>
      {/* Mini toolbar */}
      <div className="p-3 bg-stone-100 dark:bg-stone-900 border-b border-stone-200 dark:border-stone-800 flex items-center justify-between z-10 shrink-0">
        <div className="flex items-center gap-2">
          <Layers className="w-4 h-4 text-red-700 dark:text-red-500 animate-pulse" />
          <div>
            <h4 className="text-[10px] uppercase font-bold tracking-widest">Hierarchy Vertical Radar</h4>
            <p className="text-[9px] text-stone-500 dark:text-stone-400 font-mono">Top-to-Bottom mapping of editorial levels</p>
          </div>
        </div>

        <div className="flex items-center gap-1.5">
          {activeNode && (
            <div className="bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800/80 px-2 py-0.5 rounded text-[8px] font-mono uppercase tracking-wider font-bold text-emerald-700 dark:text-emerald-400">
              Active: {activeNode.item.level} ({activeNode.item.categoryName})
            </div>
          )}
          <button
            onClick={() => setZoomLevel(z => Math.max(0.5, z - 0.1))}
            className="p-1 bg-white dark:bg-stone-800 border border-stone-300 dark:border-stone-700 rounded text-stone-600 dark:text-stone-300 hover:text-stone-900 dark:hover:text-white hover:bg-stone-50 transition-colors cursor-pointer"
            title="Zoom Out"
          >
            <ZoomOut className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={() => setZoomLevel(z => Math.min(1.4, z + 0.1))}
            className="p-1 bg-white dark:bg-stone-800 border border-stone-300 dark:border-stone-700 rounded text-stone-600 dark:text-stone-300 hover:text-stone-900 dark:hover:text-white hover:bg-stone-50 transition-colors cursor-pointer"
            title="Zoom In"
          >
            <ZoomIn className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={() => setZoomLevel(0.85)}
            className="p-1 bg-white dark:bg-stone-800 border border-stone-300 dark:border-stone-700 rounded text-stone-600 dark:text-stone-300 hover:text-stone-900 dark:hover:text-white hover:bg-stone-50 transition-colors cursor-pointer"
            title="Recenter"
          >
            <Compass className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* SVG Viewport */}
      <div className="flex-1 overflow-auto relative">
        {newsItems.length === 0 ? (
          <div className="absolute inset-0 flex items-center justify-center text-stone-500 font-serif italic text-xs">
            No active hierarchy to display.
          </div>
        ) : (
          <div
            className="origin-top-left transition-transform duration-150 ease-out"
            style={{
              transform: `scale(${zoomLevel})`,
              width: `${layout.width}px`,
              height: `${layout.height}px`
            }}
          >
            <svg
              width={layout.width}
              height={layout.height}
              className="absolute inset-0 select-none"
            >
              <defs>
                <pattern id="vertical-grid" width="30" height="30" patternUnits="userSpaceOnUse">
                  <path d="M 30 0 L 0 0 0 30" fill="none" stroke="rgba(120, 120, 120, 0.05)" strokeWidth="1" />
                </pattern>
              </defs>
              <rect width="100%" height="100%" fill="url(#vertical-grid)" />

              {/* Draw connections with vertical emphasis */}
              <g>
                {layout.links.map((link) => {
                  const isLinkInActivePath = activePathIds.has(link.sourceId) && activePathIds.has(link.targetId);
                  return (
                    <path
                      key={link.id}
                      d={link.pathData}
                      fill="none"
                      stroke={isLinkInActivePath ? '#DC2626' : 'rgba(120, 113, 108, 0.25)'}
                      strokeWidth={isLinkInActivePath ? 2.5 : 1}
                      strokeDasharray={isLinkInActivePath ? 'none' : '2 2'}
                      className="transition-all duration-300"
                    />
                  );
                })}
              </g>

              {/* Draw Nodes */}
              <g>
                {layout.nodes.map((node) => {
                  const colors = LEVEL_COLORS[node.item.level];
                  const isActive = node.id === activeNewsId;
                  const isPathHighlight = activePathIds.has(node.id);

                  return (
                    <g
                      key={node.id}
                      className="cursor-pointer"
                      onClick={() => onSelectNode(node.id)}
                      onMouseEnter={() => setHoveredNode(node)}
                      onMouseLeave={() => setHoveredNode(null)}
                    >
                      {/* Interactive hover/active highlight circle */}
                      {(isActive || isPathHighlight) && (
                        <circle
                          cx={node.x}
                          cy={node.y}
                          r={48}
                          className="fill-none stroke-red-600/10 dark:stroke-red-400/10"
                          strokeWidth={isActive ? 5 : 2}
                          strokeDasharray="4 2"
                        />
                      )}

                      {/* Small point anchor on node center */}
                      <circle
                        cx={node.x}
                        cy={node.y}
                        r={isActive ? 5 : 3.5}
                        className={`${isActive ? 'fill-red-600 dark:fill-red-500' : 'fill-stone-400 dark:fill-stone-600'}`}
                      />

                      {/* HTML Card Container */}
                      <foreignObject
                        x={node.x - 60}
                        y={node.y - 30}
                        width={120}
                        height={60}
                        className="overflow-visible"
                      >
                        <div
                          className={`w-[110px] mx-auto rounded-lg border p-1.5 text-center transition-all duration-200 select-none flex flex-col justify-between h-[52px] ${
                            isActive
                              ? 'bg-white dark:bg-stone-900 border-red-600 dark:border-red-500 ring-2 ring-red-500/20 scale-[1.04] shadow-md'
                              : isPathHighlight
                              ? 'bg-stone-50 dark:bg-stone-900 border-stone-400 dark:border-stone-600 shadow-sm'
                              : 'bg-stone-100/90 dark:bg-stone-900/60 border-stone-200 dark:border-stone-850 hover:border-stone-400 hover:scale-[1.02] shadow-3xs'
                          }`}
                        >
                          <span
                            className={`text-[7px] font-extrabold tracking-wider uppercase px-1 py-0.2 rounded w-fit mx-auto ${colors.text} ${colors.bg} border border-stone-200/50 dark:border-stone-800/50`}
                          >
                            {node.item.level}
                          </span>
                          <div className={`font-bold text-[9px] truncate tracking-tight transition-colors ${isActive ? 'text-red-700 dark:text-red-400' : 'text-stone-950 dark:text-stone-105'}`}>
                            {node.item.categoryName}
                          </div>
                          <div className="text-[7.5px] text-stone-500 dark:text-stone-400 truncate font-serif italic">
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

      {/* Detail card detail preview overlay */}
      <AnimatePresence>
        {hoveredNode && (
          <motion.div
            initial={{ opacity: 0, y: 10, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 10, scale: 0.95 }}
            className="absolute bottom-3 left-3 right-3 p-3 bg-white dark:bg-stone-900 border border-stone-300 dark:border-stone-800 rounded-lg shadow-lg z-20 pointer-events-none text-left"
          >
            <div className="flex items-center justify-between mb-1">
              <span className={`text-[8px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded ${LEVEL_COLORS[hoveredNode.item.level].text} ${LEVEL_COLORS[hoveredNode.item.level].bg}`}>
                {hoveredNode.item.level}
              </span>
              <span className="text-[8px] text-stone-400 dark:text-stone-500 font-mono">ID: {hoveredNode.id}</span>
            </div>
            <h5 className="text-[10px] font-bold text-stone-900 dark:text-white leading-tight mb-1 truncate">
              {hoveredNode.item.categoryName}: {hoveredNode.item.title}
            </h5>
            <p className="text-[9.5px] text-stone-600 dark:text-stone-300 line-clamp-2 italic font-serif leading-relaxed">
              {hoveredNode.item.summary}
            </p>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
