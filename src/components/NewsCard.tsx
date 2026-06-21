import React from 'react';
import { motion } from 'motion/react';
import { ExternalLink, ChevronUp, ChevronDown, ChevronLeft, ChevronRight, Layers, ArrowUpRight } from 'lucide-react';
import { NewsItem, HierarchyLevel } from '../types';

interface NewsCardProps {
  item: NewsItem;
  breadcrumbs: string[];
  onSwipeUp: () => void;
  onSwipeDown: () => void;
  onSwipeLeft: () => void; // Deeper
  onSwipeRight: () => void; // Above
  hasNextSibling: boolean;
  hasPrevSibling: boolean;
  hasChildren: boolean;
  hasParent: boolean;
  keyboardGuide?: boolean;
  progressPercent?: number;
}

const LEVEL_LABELS: Record<HierarchyLevel, string> = {
  Global: 'Global Headline',
  Geography: 'Geographic Context',
  Country: 'Country Spotlight',
  Sector: 'Sector Macro',
  Industry: 'Industry Niche',
  Stock: 'Stock Specific'
};

const LEVEL_THEMES: Record<HierarchyLevel, { text: string; bg: string; border: string; accentBg: string }> = {
  Global: { text: 'text-red-700', bg: 'bg-red-50', border: 'border-red-200/60', accentBg: 'bg-red-500/10' },
  Geography: { text: 'text-stone-850', bg: 'bg-stone-50', border: 'border-stone-300', accentBg: 'bg-stone-500/10' },
  Country: { text: 'text-amber-800', bg: 'bg-amber-50', border: 'border-amber-200/60', accentBg: 'bg-amber-500/10' },
  Sector: { text: 'text-blue-800', bg: 'bg-blue-50', border: 'border-blue-200/60', accentBg: 'bg-blue-500/10' },
  Industry: { text: 'text-emerald-800', bg: 'bg-emerald-50', border: 'border-emerald-200/60', accentBg: 'bg-emerald-500/10' },
  Stock: { text: 'text-purple-800', bg: 'bg-purple-50', border: 'border-purple-200/60', accentBg: 'bg-purple-500/10' }
};

export default function NewsCard({
  item,
  breadcrumbs,
  onSwipeUp,
  onSwipeDown,
  onSwipeLeft,
  onSwipeRight,
  hasNextSibling,
  hasPrevSibling,
  hasChildren,
  hasParent,
  keyboardGuide = true,
  progressPercent = 0
}: NewsCardProps) {
  const theme = LEVEL_THEMES[item.level] || LEVEL_THEMES.Global;
  const imageUrl = item.imageUrl || `https://images.unsplash.com/photo-1590283603385-17ffb3a7f29f?auto=format&fit=crop&w=800&q=80`;

  const isBullish = (item.changePercent ?? 0) >= 0;
  const isZero = item.changePercent === 0 || item.changePercent === undefined;

  const cardShadowClass = isZero
    ? 'shadow-xl border-t-4 border-t-stone-400'
    : isBullish
      ? 'shadow-[0_15px_35px_rgba(16,185,129,0.18)] border-t-4 border-t-emerald-500 ring-1 ring-emerald-500/10'
      : 'shadow-[0_15px_35px_rgba(239,68,68,0.18)] border-t-4 border-t-red-500 ring-1 ring-red-500/10';

  const handleDragEnd = (event: any, info: any) => {
    const thresholdX = 100;
    const thresholdY = 80;

    if (info.offset.x < -thresholdX && hasParent) {
      onSwipeLeft(); // Left swipe drags left -> Jumps to above level
    } else if (info.offset.x > thresholdX && hasChildren) {
      onSwipeRight(); // Right swipe drags right -> Goes to next deeper level
    } else if (info.offset.y < -thresholdY && hasNextSibling) {
      onSwipeDown(); 
    } else if (info.offset.y > thresholdY && hasPrevSibling) {
      onSwipeUp(); 
    }
  };

  const lastWheelTime = React.useRef<number>(0);

  const handleWheel = (e: React.WheelEvent<HTMLDivElement>) => {
    const now = Date.now();
    if (now - lastWheelTime.current < 450) return; // Cooldown for smooth trackpad pagination

    if (e.deltaY > 15) {
      if (hasNextSibling) {
        onSwipeDown();
        lastWheelTime.current = now;
      }
    } else if (e.deltaY < -15) {
      if (hasPrevSibling) {
        onSwipeUp();
        lastWheelTime.current = now;
      }
    }
  };

  return (
    <div 
      className="w-full max-w-lg mx-auto h-[550px] select-none touch-none relative px-6 sm:px-0"
      onWheel={handleWheel}
      id={`news-viewport-${item.id}`}
    >
      <motion.div
        drag
        dragConstraints={{ left: 0, right: 0, top: 0, bottom: 0 }}
        dragElastic={0.2}
        onDragEnd={handleDragEnd}
        className={`w-full h-full bg-white border border-stone-250 text-[#111111] rounded-2xl overflow-hidden relative flex flex-col justify-between cursor-grab active:cursor-grabbing transition-shadow ${cardShadowClass}`}
        whileDrag={{ scale: 0.98 }}
        id={`news-card-inner-${item.id}`}
      >
        {/* Progress Bar indicating hierarchy-level progress */}
        <div className="absolute top-0 left-0 right-0 h-[4px] bg-stone-200/50 z-40 pointer-events-none">
          <motion.div
            className="h-full bg-red-700 shadow-[0_0_8px_rgba(185,28,28,0.5)]"
            initial={{ width: 0 }}
            animate={{ width: `${progressPercent}%` }}
            transition={{ duration: 0.4, ease: "easeOut" }}
          />
        </div>

        {/* Full-bleed visual top portion (Inshorts Crop) */}
        <div className="h-[210px] relative overflow-hidden bg-stone-900 pointer-events-none">
          <img
            src={imageUrl}
            alt={item.categoryName}
            referrerPolicy="no-referrer"
            className="w-full h-full object-cover filter saturate-[0.80] contrast-[1.02] brightness-[0.9]"
            loading="lazy"
          />
          {/* Bottom scrim mask */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-black/35" />

          {/* Floater taxonomy indicator tag */}
          <div className="absolute top-3 left-3 flex gap-2">
            <span className={`text-[9px] font-black uppercase tracking-wider px-2 py-0.5 rounded shadow-sm ${theme.bg} ${theme.text} border ${theme.border} inline-flex items-center gap-1`}>
              <Layers className="w-2.5 h-2.5" />
              {LEVEL_LABELS[item.level]}
            </span>
            <span className="text-[9px] font-black tracking-wider text-white bg-red-700 px-2 py-0.5 rounded shadow-sm uppercase">
              {item.categoryName}
            </span>
          </div>

          {/* Dynamic Top-Right Asset Impact Badge */}
          {item.changePercent !== undefined && (
            <div className={`absolute top-3 right-3 flex items-center gap-1 px-2 py-0.5 rounded-full shadow-md font-mono text-[10px] font-bold uppercase tracking-wider backdrop-blur-md border ${
              isBullish 
                ? 'bg-emerald-500/90 text-white border-emerald-400' 
                : 'bg-red-600/90 text-white border-red-500'
            }`}>
              {isBullish ? '▲' : '▼'} {isBullish ? '+' : ''}{item.changePercent}%
            </div>
          )}

          <div className="absolute bottom-3 left-4 right-4">
            {/* Breadcrumbs showing full navigation node link path */}
            <div className="flex flex-wrap items-center gap-1 text-[9px] text-white/90 font-mono tracking-wide uppercase bg-black/50 backdrop-blur-sm py-0.5 px-2 rounded border border-white/10 inline-flex">
              {breadcrumbs.map((crumb, idx) => (
                <React.Fragment key={idx}>
                  <span className={idx === breadcrumbs.length - 1 ? 'text-red-400 font-extrabold' : 'font-medium'}>
                    {crumb}
                  </span>
                  {idx < breadcrumbs.length - 1 && <span className="text-white/40">/</span>}
                </React.Fragment>
              ))}
            </div>
          </div>
        </div>

        {/* Content Section (Typeset for high readability density) */}
        <div className="p-5 pb-[54px] flex-1 flex flex-col justify-between bg-[#FCFAF7] overflow-y-auto">
          <div>
            <h2 className="text-[17px] md:text-[19px] font-sans font-black text-stone-950 tracking-tight leading-[1.3] mb-2 text-left">
              {item.title}
            </h2>

            {/* Inshorts signature Meta bar (short by author / date) */}
            <div className="text-[10px] text-stone-500 font-sans mb-3 text-left flex flex-wrap items-center gap-1.5 leading-none">
              <span className="text-stone-400/80">short by</span>
              <span className="font-bold text-stone-800 uppercase tracking-widest text-[9px]">{item.source || 'Inshorts'}</span>
              <span className="text-stone-300 font-light">•</span>
              <span className="font-semibold text-stone-500">{item.date}</span>
            </div>

            {/* Asset Impact Metric HUD */}
            {(item.changePercent !== undefined || item.benchmarkLabel) && (
              <div className="flex items-center gap-2 mb-3 bg-white border border-stone-200/80 rounded-xl p-2.5 shadow-sm text-left">
                <div className="flex flex-col">
                  <span className="text-[8px] font-mono font-extrabold uppercase tracking-widest text-[#888888] leading-none mb-0.5">impacted asset benchmark</span>
                  <span className="text-xs font-extrabold text-stone-900 font-sans tracking-tight">{item.benchmarkLabel || 'Benchmark'}</span>
                </div>
                <div className="ml-auto flex items-center gap-2">
                  <span className={`text-[11px] font-black font-mono px-2 py-0.5 rounded border leading-none ${
                    (item.changePercent ?? 0) >= 0 
                      ? 'bg-emerald-50 text-emerald-800 border-emerald-200' 
                      : 'bg-red-50 text-red-800 border-red-200'
                  }`}>
                    {(item.changePercent ?? 0) >= 0 ? '+' : ''}{item.changePercent}%
                  </span>
                  <span className={`text-[9px] uppercase font-mono font-bold tracking-wider leading-none ${(item.changePercent ?? 0) >= 0 ? 'text-emerald-700' : 'text-red-700'}`}>
                    {(item.changePercent ?? 0) >= 0 ? 'Bullish' : 'Bearish'}
                  </span>
                </div>
              </div>
            )}

            {/* Summary text block aligned with proper margin spacing */}
            <p className="text-stone-700 leading-relaxed font-sans text-xs sm:text-[13px] md:text-sm text-left tracking-normal text-justify">
              {item.summary || "No summary details are synchronized for this card entry."}
            </p>
          </div>
        </div>

        {/* Inshorts Signature Absolute Footer Banner strip */}
        {item.link ? (
          <a
            href={item.link}
            target="_blank"
            rel="noreferrer"
            className="absolute bottom-0 left-0 right-0 h-[42px] bg-stone-900 hover:bg-stone-850 text-stone-50 text-[10px] font-extrabold uppercase tracking-widest flex items-center justify-between px-4 transition-colors z-10 cursor-pointer border-t border-black shadow-[inset_0_1px_0_rgba(255,255,255,0.08)]"
          >
            <span className="truncate">read more at <strong className="font-sans font-black text-red-400">{item.source || 'Bloomberg'}</strong></span>
            <span className="flex items-center gap-1 text-[9px] text-stone-400 shrink-0 capitalize">
              tap to open <ArrowUpRight className="w-3.5 h-3.5 text-red-500 shrink-0" />
            </span>
          </a>
        ) : (
          <div className="absolute bottom-0 left-0 right-0 h-[42px] bg-stone-900 border-t border-black text-stone-400 text-[10px] font-sans font-bold flex items-center px-4 z-20 shadow-[inset_0_1px_0_rgba(255,255,255,0.08)]">
            Daily Hierarchical News Digest
          </div>
        )}
      </motion.div>

      {/* Floating Manual Navigation controls around the card (visible and accessible on both mobile and desktop) */}
      <div className="absolute left-2.5 sm:-left-12 top-1/2 -translate-y-1/2 flex flex-col gap-2 z-20 transition-opacity">
        <button
          onClick={onSwipeLeft}
          disabled={!hasParent}
          className="w-8 h-8 sm:w-9 sm:h-9 rounded-full border border-stone-250 bg-white/95 backdrop-blur-md shadow-md hover:bg-stone-50 hover:border-stone-400 flex items-center justify-center text-stone-700 disabled:opacity-25 disabled:cursor-not-allowed cursor-pointer transition-all active:scale-95"
          title="Go Above Level"
        >
          <ChevronLeft className="w-4 h-4 text-stone-800" />
        </button>
      </div>

      <div className="absolute right-2.5 sm:-right-12 top-1/2 -translate-y-1/2 flex flex-col gap-2 z-20 transition-opacity">
        <button
          onClick={onSwipeRight}
          disabled={!hasChildren}
          className="w-8 h-8 sm:w-9 sm:h-9 rounded-full border border-stone-250 bg-white/95 backdrop-blur-md shadow-md hover:bg-stone-50 hover:border-stone-400 flex items-center justify-center text-stone-700 disabled:opacity-25 disabled:cursor-not-allowed cursor-pointer transition-all active:scale-95"
          title="Go Deeper Level"
        >
          <ChevronRight className="w-4 h-4 text-stone-800" />
        </button>
      </div>

      <div className="absolute left-1/2 -top-6 sm:-top-12 -translate-x-1/2 flex gap-2 z-20 transition-opacity">
        <button
          onClick={onSwipeUp}
          disabled={!hasPrevSibling}
          className="w-8 h-8 sm:w-9 sm:h-9 rounded-full border border-stone-250 bg-white/95 backdrop-blur-md shadow-md hover:bg-stone-50 hover:border-stone-400 flex items-center justify-center text-stone-700 disabled:opacity-25 disabled:cursor-not-allowed cursor-pointer transition-all active:scale-95"
          title="Scroll Up (Previous Sibling Card)"
        >
          <ChevronUp className="w-4 h-4 text-stone-800" />
        </button>
      </div>

      <div className="absolute left-1/2 -bottom-6 sm:-bottom-12 -translate-x-1/2 flex gap-2 z-20 transition-opacity">
        <button
          onClick={onSwipeDown}
          disabled={!hasNextSibling}
          className="w-8 h-8 sm:w-9 sm:h-9 rounded-full border border-stone-250 bg-white/95 backdrop-blur-md shadow-md hover:bg-stone-50 hover:border-stone-400 flex items-center justify-center text-stone-700 disabled:opacity-25 disabled:cursor-not-allowed cursor-pointer transition-all active:scale-95"
          title="Scroll Down (Next Sibling Card)"
        >
          <ChevronDown className="w-4 h-4 text-stone-800" />
        </button>
      </div>

      {/* Elegant Mini Keyboard Hud indicators right below */}
      {keyboardGuide && (
        <div className="absolute -bottom-14 left-0 right-0 hidden md:flex items-center justify-center gap-3 text-[10px] text-stone-400 font-mono bg-stone-50/50 p-1.5 rounded-lg border border-stone-200 max-w-sm mx-auto shadow-sm">
          <span className="flex items-center gap-1 font-semibold"><kbd className="px-1 bg-white border border-stone-250 rounded shadow-sm text-stone-700 font-bold">↑</kbd><kbd className="px-1 bg-white border border-stone-250 rounded shadow-sm text-stone-700 font-bold">↓</kbd> Sibling</span>
          <span className="flex items-center gap-1 font-semibold"><kbd className="px-1 bg-white border border-stone-250 rounded shadow-sm text-stone-700 font-bold">←</kbd> Above</span>
          <span className="flex items-center gap-1 font-semibold"><kbd className="px-1 bg-white border border-stone-250 rounded shadow-sm text-stone-700 font-bold">→</kbd> Deeper</span>
        </div>
      )}
    </div>
  );
}
