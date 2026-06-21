import { useState, useMemo, FormEvent } from 'react';
import { PlusCircle, Database, Loader2 } from 'lucide-react';
import { NewsItem, HierarchyLevel, HIERARCHY_ORDER } from '../types';

interface AdminPanelProps {
  newsItems: NewsItem[];
  onAddNewsItem: (item: Omit<NewsItem, 'date'>) => Promise<void>;
  isSyncing: boolean;
}

export default function AdminPanel({ newsItems, onAddNewsItem, isSyncing }: AdminPanelProps) {
  const [level, setLevel] = useState<HierarchyLevel>('Global');
  const [categoryName, setCategoryName] = useState('');
  const [parentId, setParentId] = useState('');
  const [title, setTitle] = useState('');
  const [summary, setSummary] = useState('');
  const [source, setSource] = useState('Market Desk');
  const [link, setLink] = useState('');
  const [imageUrl, setImageUrl] = useState('');
  const [changePercent, setChangePercent] = useState<string>('0.0');
  const [benchmarkLabel, setBenchmarkLabel] = useState<string>('');

  const [message, setMessage] = useState<{ text: string; type: 'success' | 'err' } | null>(null);

  // Determine potential parents based on hierarchy rules
  // Standard chain: Global (0) -> Geography (1) -> Country (2) -> Sector (3) -> Industry (4) -> Stock (5)
  // Parents of level L should have level L-1
  const parentCandidates = useMemo(() => {
    const levelIndex = HIERARCHY_ORDER.indexOf(level);
    if (levelIndex <= 0) return []; // Global has no parent

    const targetParentLevel = HIERARCHY_ORDER[levelIndex - 1];
    return newsItems.filter(item => item.level === targetParentLevel);
  }, [newsItems, level]);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!categoryName || !title || !summary) {
      setMessage({ text: 'Missing required fields: Name, Title, and Summary', type: 'err' });
      return;
    }

    const levelIndex = HIERARCHY_ORDER.indexOf(level);
    if (levelIndex > 0 && !parentId) {
      setMessage({ text: 'A parent node must be selected for hierarchical levels.', type: 'err' });
      return;
    }

    const customId = `${level.charAt(0)}${Math.floor(100 + Math.random() * 900)}`;

    const newItem: Omit<NewsItem, 'date'> = {
      id: customId,
      level,
      parentId: parentId || null,
      categoryName,
      title,
      summary,
      source,
      link: link || undefined,
      imageUrl: imageUrl || undefined,
      changePercent: changePercent ? parseFloat(changePercent) : undefined,
      benchmarkLabel: benchmarkLabel || undefined
    };

    try {
      await onAddNewsItem(newItem);
      setMessage({ text: `Story "${categoryName}" mapped successfully under node !`, type: 'success' });
      // Reset form fields
      setCategoryName('');
      setTitle('');
      setSummary('');
      setLink('');
      setImageUrl('');
      setParentId('');
      setChangePercent('0.0');
      setBenchmarkLabel('');
    } catch (err: any) {
      console.error(err);
      setMessage({ text: err.message || 'Error occurred while saving news story.', type: 'err' });
    }
  };

  return (
    <div className="bg-[#FCFAF7] border border-stone-300 rounded-xl p-6 shadow-md text-[#1A1A1A]">
      <div className="flex items-center gap-2 mb-4 pb-3 border-b border-stone-200">
        <PlusCircle className="w-5 h-5 text-red-700" />
        <div>
          <h3 className="text-xs uppercase font-extrabold tracking-widest text-stone-900">Add Hierarchical Node</h3>
          <p className="text-[10px] text-stone-600 font-mono">Expand the daily news map with clean relations</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Level selection */}
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-[9px] font-mono text-stone-600 uppercase mb-1 font-bold">Level Group</label>
            <select
              value={level}
              onChange={(e) => {
                setLevel(e.target.value as HierarchyLevel);
                setParentId('');
              }}
              className="w-full bg-white border border-stone-300 rounded-md p-2 text-xs text-stone-900 focus:outline-none focus:border-stone-500 font-bold tracking-tight"
            >
              {HIERARCHY_ORDER.map((lvl) => (
                <option key={lvl} value={lvl}>
                  {lvl}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-[9px] font-mono text-stone-600 uppercase mb-1 font-bold">Category / Tag Name</label>
            <input
              type="text"
              required
              placeholder={level === 'Stock' ? 'e.g. Apple Inc' : 'e.g. United States'}
              value={categoryName}
              onChange={(e) => setCategoryName(e.target.value)}
              className="w-full bg-white border border-stone-300 rounded-md p-2 text-xs text-stone-900 placeholder-stone-400 focus:outline-none focus:border-stone-500 font-mono"
            />
          </div>
        </div>

        {/* Dynamic Parent binding selection */}
        {level !== 'Global' && (
          <div>
            <label className="block text-[9px] font-mono text-stone-600 uppercase mb-1 font-bold">
              Parent Node{' '}
              <span className="text-red-700 font-extrabold">
                ({HIERARCHY_ORDER[HIERARCHY_ORDER.indexOf(level) - 1]})
              </span>
            </label>
            {parentCandidates.length === 0 ? (
              <div className="text-[10px] text-amber-800 bg-amber-50 p-2.5 rounded border border-amber-200 font-serif italic">
                You must add parent news node at the{' '}
                <strong>{HIERARCHY_ORDER[HIERARCHY_ORDER.indexOf(level) - 1]}</strong> level first!
              </div>
            ) : (
              <select
                value={parentId}
                required
                onChange={(e) => setParentId(e.target.value)}
                className="w-full bg-white border border-stone-300 rounded-md p-2 text-xs text-stone-900 focus:outline-none focus:border-stone-500 font-mono"
              >
                <option value="">-- Choose Parent relation --</option>
                {parentCandidates.map((p) => (
                  <option key={p.id} value={p.id}>
                    [{p.id}] {p.categoryName} - {p.title.slice(0, 32)}...
                  </option>
                ))}
              </select>
            )}
          </div>
        )}

        {/* Title */}
        <div>
          <label className="block text-[9px] font-mono text-stone-600 uppercase mb-1 font-bold">Headline</label>
          <input
            type="text"
            required
            placeholder="An elegant concise news title"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="w-full bg-white border border-stone-300 rounded-md p-2 text-xs text-stone-900 placeholder-stone-400 focus:outline-none focus:border-stone-500 font-serif font-semibold"
          />
        </div>

        {/* Summary */}
        <div>
          <label className="block text-[9px] font-mono text-stone-600 uppercase mb-1 font-bold">Inshorts 60-Word Summary</label>
          <textarea
            required
            rows={3}
            placeholder="Summarize the core story in exactly or under 60 words for quick card reading..."
            value={summary}
            onChange={(e) => setSummary(e.target.value)}
            className="w-full bg-white border border-stone-300 rounded-md p-2 text-xs text-stone-800 placeholder-stone-400 focus:outline-none focus:border-stone-500 resize-none font-serif italic"
          />
        </div>

        {/* Link / Image */}
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-[9px] font-mono text-stone-600 uppercase mb-1 font-bold">Source Publisher</label>
            <input
              type="text"
              value={source}
              onChange={(e) => setSource(e.target.value)}
              className="w-full bg-white border border-stone-300 rounded-md p-2 text-xs text-stone-900 focus:outline-none focus:border-stone-500 font-bold uppercase tracking-wide"
            />
          </div>

          <div>
            <label className="block text-[9px] font-mono text-stone-600 uppercase mb-1 font-bold">Target URL</label>
            <input
              type="url"
              placeholder="https://example.com/story"
              value={link}
              onChange={(e) => setLink(e.target.value)}
              className="w-full bg-white border border-stone-300 rounded-md p-2 text-xs text-stone-900 focus:outline-none focus:border-stone-500 font-mono"
            />
          </div>
        </div>

        <div>
          <label className="block text-[9px] font-mono text-stone-600 uppercase mb-1 font-bold">Hero Image URL (Optional)</label>
          <input
            type="url"
            placeholder="e.g. Unsplash URL"
            value={imageUrl}
            onChange={(e) => setImageUrl(e.target.value)}
            className="w-full bg-white border border-stone-300 rounded-md p-2 text-xs text-stone-900 focus:outline-none focus:border-stone-500 font-mono"
          />
        </div>

        {/* Associated Shift Metrics form inputs */}
        <div className="grid grid-cols-2 gap-3 bg-red-50/20 p-3 rounded-lg border border-red-100">
          <div>
            <label className="block text-[9px] font-mono text-red-800 uppercase mb-1 font-black">Daily Change % (e.g. -1.4 or 2.3)</label>
            <input
              type="number"
              step="0.01"
              placeholder="0.00"
              value={changePercent}
              onChange={(e) => setChangePercent(e.target.value)}
              className="w-full bg-white border border-stone-300 rounded-md p-2 text-xs text-stone-900 focus:outline-none focus:border-stone-500 font-mono"
            />
          </div>

          <div>
            <label className="block text-[9px] font-mono text-red-800 uppercase mb-1 font-black">Tracked Ticker/Asset (e.g. BTC, INFY, NIFTY)</label>
            <input
              type="text"
              placeholder="e.g. NIFTY 50"
              value={benchmarkLabel}
              onChange={(e) => setBenchmarkLabel(e.target.value)}
              className="w-full bg-white border border-stone-300 rounded-md p-2 text-xs text-stone-900 focus:outline-none focus:border-stone-500 font-bold uppercase"
            />
          </div>
        </div>

        {/* Form Notifications */}
        {message && (
          <div
            className={`p-2.5 rounded text-xs font-bold leading-relaxed ${
              message.type === 'success'
                ? 'bg-emerald-50 text-emerald-900 border border-emerald-200'
                : 'bg-red-50 text-red-900 border border-red-200'
            }`}
          >
            {message.text}
          </div>
        )}

        {/* Submit */}
        <button
          type="submit"
          disabled={isSyncing || (level !== 'Global' && parentCandidates.length === 0)}
          className="w-full py-2.5 px-4 bg-stone-900 hover:bg-stone-850 text-stone-50 font-bold rounded text-[10px] tracking-widest uppercase transition-colors flex items-center justify-center gap-2 cursor-pointer shadow-sm border border-black active:scale-98 disabled:opacity-40"
        >
          {isSyncing ? (
            <>
              <Loader2 className="w-3.5 h-3.5 animate-spin" />
              <span>Syncing with Sheet...</span>
            </>
          ) : (
            <>
              <Database className="w-3.5 h-3.5" />
              <span>Append Node to Google Sheet</span>
            </>
          )          }
        </button>
      </form>
    </div>
  );
}
