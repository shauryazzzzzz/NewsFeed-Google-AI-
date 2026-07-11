import { useState, useEffect, useMemo, useCallback, FormEvent } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  FileSpreadsheet,
  Layers,
  Sparkles,
  BookOpen,
  LogOut,
  Calendar,
  Database,
  Plus,
  Loader2,
  Bookmark,
  ChevronUp,
  ChevronDown,
  Info,
  ExternalLink,
  ChevronRight,
  ChevronLeft,
  Network,
  HelpCircle,
  GitFork,
  ArrowRight,
  Maximize2,
  Settings,
  X,
  CheckCircle2,
  AlertCircle,
  AlertTriangle,
  XCircle,
  Check,
  Activity,
  Terminal,
  RefreshCw,
  Clock,
  User,
  LogIn,
  Shield,
  Download
} from 'lucide-react';

import { NewsItem, HierarchyLevel, SpreadsheetInfo, HIERARCHY_ORDER } from './types';
import { initAuth, googleSignIn, logout, auth } from './lib/firebase';
import {
  listUserSpreadsheets,
  fetchSpreadsheetInfo,
  createNewSpreadsheet,
  createNewTab,
  fetchNewsFromTab,
  appendNewsToTab,
  populateTabWithSampleData,
  overwriteTabWithAIStories,
  seed500PastWeekNews
} from './lib/sheets';
import {
  getBreadcrumbs,
  getSiblingNodes,
  getChildNodes,
  getParentNode
} from './utils/hierarchy';
import { generateLastWeek500News } from './utils/seeder';

import NewsCard from './components/NewsCard';
import MindMap from './components/MindMap';
import AdminPanel from './components/AdminPanel';
import VerticalHierarchyMap from './components/VerticalHierarchyMap';

// High impact sample fallback dataset used for Sandbox exploration
const SANDBOX_MOCKED_DATE = '2026-06-19';
const OLD_UNUSED_NEWS: NewsItem[] = [
  // ---------------- TODAY (2026-06-19) ----------------
  {
    id: 'G1',
    level: 'Global',
    parentId: null,
    categoryName: 'Global Economy',
    title: 'Global Markets Pivot on Inflation Data & High Interest Rates',
    summary: 'World stock markets fluctuated wildy as consumer demand prints came in mixed. Investors globally are watching closely for signals from premier monetary authorities on easing credit restrictions in the final quarters, shifting massive cross-border asset reallocations.',
    source: 'Financial Times',
    link: 'https://ft.com',
    imageUrl: 'https://images.unsplash.com/photo-1526304640581-d334cdbbf45e?auto=format&fit=crop&w=600&q=80',
    date: '2026-06-19',
    changePercent: 0.25,
    benchmarkLabel: 'MSCI World'
  },
  {
    id: 'GEO1',
    level: 'Geography',
    parentId: 'G1',
    categoryName: 'Asia-Pacific',
    title: 'Asia-Pacific Technology Markets Lead Relocation Wave',
    summary: 'The broader APAC region reports strong export volumes matching double-digit hardware manufacturing shifts. Tech-friendly economic policies across key tech corridors keep valuations buoyed amid local consumption tailwinds.',
    source: 'Reuters',
    link: 'https://reuters.com',
    imageUrl: 'https://images.unsplash.com/photo-1444653389962-8149286c578a?auto=format&fit=crop&w=600&q=80',
    date: '2026-06-19',
    changePercent: 1.15,
    benchmarkLabel: 'APAC Index'
  },
  {
    id: 'GEO2',
    level: 'Geography',
    parentId: 'G1',
    categoryName: 'North America',
    title: 'North American Supply Lines Scale Fab Infrastructure',
    summary: 'US and Canadian corporate capitals are fast-tracking data-center investments. The continent is seeing monumental build schemes aimed at localizing silicon lines, fueled by multi-billion public grants and state mandates.',
    source: 'Bloomberg',
    link: 'https://bloomberg.com',
    imageUrl: 'https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?auto=format&fit=crop&w=600&q=80',
    date: '2026-06-19',
    changePercent: -0.48,
    benchmarkLabel: 'S&P 500'
  },
  {
    id: 'C1',
    level: 'Country',
    parentId: 'GEO1',
    categoryName: 'India',
    title: 'India Gains Ground in Global Advanced Electronics Assembly',
    summary: "India's production incentive strategies have successfuly drawn international hardware titans to double assembly operations. Domestic manufacturing clusters expand rapidly, creating professional engineering workforces at scale.",
    source: 'Economic Times',
    link: 'https://economictimes.indiatimes.com',
    imageUrl: 'https://images.unsplash.com/photo-1532375811409-90d11193060b?auto=format&fit=crop&w=600&q=80',
    date: '2026-06-19',
    changePercent: 1.25,
    benchmarkLabel: 'NIFTY 50'
  },
  {
    id: 'C2',
    level: 'Country',
    parentId: 'GEO2',
    categoryName: 'United States',
    title: 'United States Approves Billions for Advanced Chip Fabs',
    summary: 'Federal agencies unlocked a massive second tranche of domestic manufacturing grants. New fabrication facilities across Arizona, Oregon and Ohio are breaking ground to anchor regional hardware independence.',
    source: 'WSJ',
    link: 'https://wsj.com',
    imageUrl: 'https://images.unsplash.com/photo-1516321318423-f06f85e504b3?auto=format&fit=crop&w=600&q=80',
    date: '2026-06-19',
    changePercent: -0.15,
    benchmarkLabel: 'NASDAQ'
  },
  {
    id: 'S1',
    level: 'Sector',
    parentId: 'C1',
    categoryName: 'Technology & IT',
    title: 'NIFTY IT Index Surges as Government Announces Tax Relief for Digital Exporters',
    summary: 'The subcontinental IT services sector is receiving heavy digital infrastructure modernizing workloads. A surge in long-term enterprise SaaS contracts and hybrid cloud optimization requests are leading to positive guidance for top-tier software exporters.',
    source: 'TechCrunch',
    link: 'https://techcrunch.com',
    imageUrl: 'https://images.unsplash.com/photo-1518770660439-4636190af475?auto=format&fit=crop&w=600&q=80',
    date: '2026-06-19',
    changePercent: 2.40,
    benchmarkLabel: 'NIFTY IT'
  },
  {
    id: 'S2',
    level: 'Sector',
    parentId: 'C2',
    categoryName: 'Tech Hardware & Systems',
    title: 'US Tech Infrastructure Directing Capital into GPU Clusters',
    summary: 'With demand for AI model training skyrocketing, major tech providers are upgrading their hardware footprints. Venture backing is reallocating toward custom chips, cooling setups, and fiber grids.',
    source: 'Wired',
    link: 'https://wired.com',
    imageUrl: 'https://images.unsplash.com/photo-1558494949-ef010cbdcc31?auto=format&fit=crop&w=600&q=80',
    date: '2026-06-19',
    changePercent: 1.10,
    benchmarkLabel: 'SOX Index'
  },
  {
    id: 'I1',
    level: 'Industry',
    parentId: 'S1',
    categoryName: 'IT Services & Consulting',
    title: 'NIFTYITBEES Attracts Heavy Accruals as IT Budgets Pivot Back to Offshore Fabs',
    summary: 'Software-as-a-service platforms and consulting services are shifting pricing away from user seats toward agentic workflow completions. Automated client handling and code debugging units show high enterprise subscription rates.',
    source: 'SaaS Business Journal',
    link: 'https://saasbj.com',
    imageUrl: 'https://images.unsplash.com/photo-1460925895917-afdab827c52f?auto=format&fit=crop&w=600&q=80',
    date: '2026-06-19',
    changePercent: 1.85,
    benchmarkLabel: 'NIFTYITBEES'
  },
  {
    id: 'I2',
    level: 'Industry',
    parentId: 'S2',
    categoryName: 'Semiconductors & Accelerators',
    title: 'Silicon Designers Focus on Dynamic Power-Management Tooling',
    summary: 'As power budgets spike at global datacenters, the primary challenge has turned from compute speed to watts-per-flop efficiency. Breakthroughs in packaging and custom instructions show high promise.',
    source: 'Semiconductor Today',
    link: 'https://semitoday.com',
    imageUrl: 'https://images.unsplash.com/photo-1518770660439-4636190af475?auto=format&fit=crop&w=600&q=80',
    date: '2026-06-19',
    changePercent: 2.90,
    benchmarkLabel: 'WFE Capex Index'
  },
  {
    id: 'ST1',
    level: 'Stock',
    parentId: 'I1',
    categoryName: 'Infosys Corp',
    title: 'Infosys Secures Massive $1.5 Billion Multi-Year Cloud Upgrade Contract',
    summary: 'Shares of Infosys rallied after closing a mega-deal with an international banking client to revitalize their entire digital ledger stack and configure cloud integrations, bringing stable recurring revenues.',
    source: 'NDTV Profit',
    link: 'https://ndtv.com',
    imageUrl: 'https://images.unsplash.com/photo-1542744094-3a31f103e35f?auto=format&fit=crop&w=600&q=80',
    date: '2026-06-19',
    changePercent: 3.40,
    benchmarkLabel: 'INFY',
    capGroup: 'Large'
  },
  {
    id: 'ST2',
    level: 'Stock',
    parentId: 'I1',
    categoryName: 'Tata Consultancy Services',
    title: 'TCS Partners with Major EU Insurer for Automation Migration',
    summary: 'TCS reports landing a major long-term contract to migrate core transaction processing engines to secure cloud environments, utilizing tailored SaaS layouts and AI agents to handle millions of policy claims.',
    source: 'MoneyControl',
    link: 'https://moneycontrol.com',
    imageUrl: 'https://images.unsplash.com/photo-1551836022-d5d88e9218df?auto=format&fit=crop&w=600&q=80',
    date: '2026-06-19',
    changePercent: 1.95,
    benchmarkLabel: 'TCS',
    capGroup: 'Large'
  },
  {
    id: 'ST5',
    level: 'Stock',
    parentId: 'I1',
    categoryName: 'Wipro Ltd',
    title: 'Wipro Lands Strategic Cloud Optimization & Security Deal',
    summary: 'Wipro shares advanced as the firm announced a comprehensive digital infrastructure contract with an APAC energy provider to secure endpoint systems and modernize high-throughput operational software databases.',
    source: 'NDTV Profit',
    link: 'https://ndtv.com',
    imageUrl: 'https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?auto=format&fit=crop&w=600&q=80',
    date: '2026-06-19',
    changePercent: 2.15,
    benchmarkLabel: 'WIPRO',
    capGroup: 'Large'
  },
  {
    id: 'ST_MID1',
    level: 'Stock',
    parentId: 'I1',
    categoryName: 'LTIMindtree Ltd',
    title: 'LTIMindtree Clinches Double Digital Engineering Acceleration Orders',
    summary: 'LTIMindtree stock surged as the mid-cap IT major closed multiple high-velocity digital engineering deals with global logistics aggregates, reinforcing strong demand resilience outside the traditional Big-3.',
    source: 'Economic Times',
    link: 'https://economictimes.indiatimes.com',
    imageUrl: 'https://images.unsplash.com/photo-1460925895917-afdab827c52f?auto=format&fit=crop&w=600&q=80',
    date: '2026-06-19',
    changePercent: 2.80,
    benchmarkLabel: 'LTIM',
    capGroup: 'Mid'
  },
  {
    id: 'ST_MID2',
    level: 'Stock',
    parentId: 'I1',
    categoryName: 'Coforge Ltd',
    title: 'Coforge Stock Rallies After Upgrading Yearly Margin & Contract Guidance',
    summary: 'Coforge Limited shares surged 3.1% today after revealing an improved revenue conversion pipeline on newly completed insurance and banking platform modernizations, outperforming general street estimates.',
    source: 'MoneyControl',
    link: 'https://moneycontrol.com',
    imageUrl: 'https://images.unsplash.com/photo-1502920514313-52581002a659?auto=format&fit=crop&w=600&q=80',
    date: '2026-06-19',
    changePercent: 3.10,
    benchmarkLabel: 'COFORGE',
    capGroup: 'Mid'
  },
  {
    id: 'ST_SMALL1',
    level: 'Stock',
    parentId: 'I1',
    categoryName: 'Saksoft Ltd',
    title: 'Saksoft Accelerates Global Penetration With Acquisition of Zurich Niche Practice',
    summary: 'Saksoft Limited reported that its overseas subsidiaries have finalized terms to acquire a boutique analytics consultancy based in Switzerland. This small-cap firm aims to capitalize on premium regional margins.',
    source: 'Economic Times',
    link: 'https://economictimes.indiatimes.com',
    imageUrl: 'https://images.unsplash.com/photo-1542744094-3a31f103e35f?auto=format&fit=crop&w=600&q=80',
    date: '2026-06-19',
    changePercent: 4.55,
    benchmarkLabel: 'SAKSOFT',
    capGroup: 'Small'
  },
  {
    id: 'ST_SMALL2',
    level: 'Stock',
    parentId: 'I1',
    categoryName: 'Kellton Tech Solutions',
    title: 'Kellton Tech Secures Core Digital Ledger Modernization in Middle East',
    summary: 'Kellton Tech Solutions stock touched active daily upper limits following structural digital ledger integration bookings from an oil-rich sovereign logistics manager, boosting small-cap investor confidence.',
    source: 'Reuters',
    link: 'https://reuters.com',
    imageUrl: 'https://images.unsplash.com/photo-1516321318423-f06f85e504b3?auto=format&fit=crop&w=600&q=80',
    date: '2026-06-19',
    changePercent: 5.20,
    benchmarkLabel: 'KELLTONTEC',
    capGroup: 'Small'
  },

  // ---------------- LAST WEEK (2026-06-15) ----------------
  {
    id: 'G1',
    level: 'Global',
    parentId: null,
    categoryName: 'Central Banking',
    title: 'Federal Reserve Holds Interest Rates Steady, Signals One Cut later',
    summary: 'In an expected move, the Federal Reserve kept overnight benchmark lending rate targets flat. Economic forecasts suggested high focus on incoming employment indices to measure proper disinflation paths.',
    source: 'CNBC',
    link: 'https://cnbc.com',
    imageUrl: 'https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?auto=format&fit=crop&w=600&q=80',
    date: '2026-06-15',
    changePercent: -0.12,
    benchmarkLabel: 'Fed Reserve Rate'
  },
  {
    id: 'ST3',
    level: 'Stock',
    parentId: 'I2',
    categoryName: 'NVIDIA Corp',
    title: 'NVIDIA Introduces Blackwell Architecture for Core Computing Labs',
    summary: 'NVIDIA debuted the high-performance Blackwell computing platform. Early telemetry outputs highlight extreme electrical efficiency, rendering it highly competent for trillion-parameter server networks.',
    source: 'TechCrunch',
    link: 'https://techcrunch.com',
    imageUrl: 'https://images.unsplash.com/photo-1591453089816-0fbb971b454c?auto=format&fit=crop&w=600&q=80',
    date: '2026-06-15',
    changePercent: 2.45,
    benchmarkLabel: 'NVDA'
  },

  // ---------------- LAST MONTH (2026-05-20) ----------------
  {
    id: 'G1',
    level: 'Global',
    parentId: null,
    categoryName: 'Global Commodities',
    title: 'Gold and Copper Prices Spark Widespread Infrastructure Warnings',
    summary: 'Precious metal indices hit multi-year highs today as industrial demands for wiring, grid expansions, and green power lines outstrip mined metal inputs. Smelters globally warn of raw production quotas through December.',
    source: 'Reuters',
    link: 'https://reuters.com',
    imageUrl: 'https://images.unsplash.com/photo-1610375461246-83df859d849d?auto=format&fit=crop&w=600&q=80',
    date: '2026-05-20',
    changePercent: 4.80,
    benchmarkLabel: 'COMEX Copper'
  },

  // ---------------- LAST QUARTER (2026-04-10) ----------------
  {
    id: 'G1',
    level: 'Global',
    parentId: null,
    categoryName: 'Global GDP',
    title: 'IMF Upgrades Global Economic Outlook Citing Service Resiliencies',
    summary: 'The International Monetary Fund boosted its global growth projection to 3.2% for the outer years. Positive retail patterns and lower energetic cost metrics have buffered North American and Asian industrial states.',
    source: 'Bloomberg',
    link: 'https://bloomberg.com',
    imageUrl: 'https://images.unsplash.com/photo-1526304640581-d334cdbbf45e?auto=format&fit=crop&w=600&q=80',
    date: '2026-04-10',
    changePercent: 0.30,
    benchmarkLabel: 'IMF GDP Forecast'
  }
];

const SANDBOX_NEWS: NewsItem[] = OLD_UNUSED_NEWS;

// Helper to recursively collect all descendant news items
function getDescendantsAndSelf(item: NewsItem, allItems: NewsItem[]): NewsItem[] {
  const result: NewsItem[] = [item];
  const queue = [item.id];
  const visited = new Set<string>([item.id]);

  while (queue.length > 0) {
    const currentId = queue.shift()!;
    // Find all children under current item
    const children = allItems.filter(x => x.parentId === currentId);
    for (const child of children) {
      if (!visited.has(child.id)) {
        visited.add(child.id);
        result.push(child);
        queue.push(child.id);
      }
    }
  }
  return result;
}

export default function App() {
  const [isDarkMode, setIsDarkMode] = useState(() => localStorage.getItem('theme') === 'dark');
  const [userInteractions, setUserInteractions] = useState<Record<string, {liked: boolean, disliked: boolean, starred: boolean}>>({});

  const handleInteraction = (type: 'like' | 'dislike' | 'star', id: string) => {
    setUserInteractions(prev => {
      const current = prev[id] || { liked: false, disliked: false, starred: false };
      const next = { ...current };
      if (type === 'like') { next.liked = !next.liked; next.disliked = false; }
      if (type === 'dislike') { next.disliked = !next.disliked; next.liked = false; }
      if (type === 'star') { next.starred = !next.starred; }
      return { ...prev, [id]: next };
    });
  };

  useEffect(() => {
    if (isDarkMode) {
      document.documentElement.classList.add('dark');
      document.documentElement.style.colorScheme = 'dark';
      localStorage.setItem('theme', 'dark');
    } else {
      document.documentElement.classList.remove('dark');
      document.documentElement.style.colorScheme = 'light';
      localStorage.setItem('theme', 'light');
    }
  }, [isDarkMode]);

  const [currentUser, setCurrentUser] = useState<any>(null);
  const [authToken, setAuthToken] = useState<string | null>(null);
  const [isAuthLoading, setIsAuthLoading] = useState(true);

  // Live Pipeline Diagnostics Steps for transparency and visibility
  const [initSteps, setInitSteps] = useState<Array<{
    id: string;
    label: string;
    description: string;
    status: 'idle' | 'loading' | 'success' | 'warn' | 'error';
    error?: string;
  }>>([
    { id: 'env-config', label: 'Backend Server Config', description: 'Querying /api/config for default workbook ID', status: 'idle' },
    { id: 'firebase-auth', label: 'Firebase Auth Gateway', description: 'Checking Firebase server auth initialized state', status: 'idle' },
    { id: 'oauth-detect', label: 'Google Workspace Credentials', description: 'Checking browser cache/session for Google token', status: 'idle' },
    { id: 'list-sheets', label: 'Google Sheets Connection', description: 'Quering workbook files list from authorized Drive API', status: 'idle' },
    { id: 'sheet-metadata', label: 'Workbook Structural Validation', description: 'Pulling and loading days/tabs headers from the active sheet', status: 'idle' }
  ]);

  const [diagnosticsLogs, setDiagnosticsLogs] = useState<Array<{ timestamp: string; message: string; type: 'info' | 'warn' | 'error' }>>([]);

  const addDiagnosticLog = useCallback((message: string, type: 'info' | 'warn' | 'error' = 'info') => {
    const timestamp = new Date().toLocaleTimeString();
    setDiagnosticsLogs(prev => [{ timestamp, message, type }, ...prev]);
    console.log(`[Diagnostic] ${timestamp} - ${type.toUpperCase()}: ${message}`);
  }, []);

  const updateStep = useCallback((id: string, status: 'idle' | 'loading' | 'success' | 'warn' | 'error', errorMsg?: string) => {
    setInitSteps(prev => prev.map(step => {
      if (step.id === id) {
        return { ...step, status, error: errorMsg !== undefined ? errorMsg : step.error };
      }
      return step;
    }));
  }, []);

  // Load read status from localStorage
  const [readNewsIds, setReadNewsIds] = useState<Record<string, boolean>>(() => {
    try {
      const stored = localStorage.getItem('read_news_ids_v1');
      return stored ? JSON.parse(stored) : {};
    } catch {
      return {};
    }
  });

  // App Modes: google-sheets persistence OR standalone demo sandbox
  const [isSandboxMode, setIsSandboxMode] = useState(false);

  // Default shared (Admin designated) database configuration
  const [sharedSheetId, setSharedSheetId] = useState<string | null>(null);
  const [isAdminMode, setIsAdminMode] = useState(false);

  const isActuallyAdmin = useMemo(() => {
    return currentUser?.email === 'saurabhsks01@gmail.com' || isAdminMode;
  }, [currentUser, isAdminMode]);

  // Date range slider selection: 1day, 1week, 1month, 1quarter
  const [dateRange, setDateRange] = useState<'1day' | '1week' | '1month' | '1quarter'>('1quarter');

  // Toggle visible display of interactive mindmap tree graph - defaults to false for clean, focused home screen
  const [isMindMapVisible, setIsMindMapVisible] = useState(false);

  // Active Sandbox States for Role simulation
  const [sandboxNewsStore, setSandboxNewsStore] = useState<NewsItem[]>(SANDBOX_NEWS);
  const [sandboxDates, setSandboxDates] = useState<string[]>(['2026-06-19']);
  const [sandboxActiveDate, setSandboxActiveDate] = useState<string>('2026-06-19');

  // Sheets configuration states
  const [loadingSheets, setLoadingSheets] = useState(false);
  const [spreadsheets, setSpreadsheets] = useState<{ id: string; name: string }[]>([]);
  const [selectedSheetId, setSelectedSheetId] = useState<string>('');
  const [selectedGid, setSelectedGid] = useState<string>('');
  const [sheetInfo, setSheetInfo] = useState<SpreadsheetInfo | null>(null);
  const [selectedDate, setSelectedDate] = useState<string>('');
  const [seedDurationDays, setSeedDurationDays] = useState<number>(7);

  // News items data structure state
  const [isSyncing, setIsSyncing] = useState(false);
  const [errorStatus, setErrorStatus] = useState<string | null>(null);
  const [newsItems, setNewsItems] = useState<NewsItem[]>([]);

  // Live dynamic toast notifications
  const [toasts, setToasts] = useState<{ id: string; title: string; description: string; type: 'success' | 'info' | 'warning' | 'error' }[]>([]);

  const addToast = useCallback((title: string, description: string, type: 'success' | 'info' | 'warning' | 'error' = 'info') => {
    const id = Math.random().toString(36).substring(2, 9);
    setToasts(prev => [...prev, { id, title, description, type }]);
    setTimeout(() => {
      setToasts(prev => prev.filter(t => t.id !== id));
    }, 4500);
  }, []);

  // Current reader focused card tracking ID
  const [activeNewsId, setActiveNewsId] = useState<string | null>(null);

  // Track active news item as read
  useEffect(() => {
    if (activeNewsId) {
      setReadNewsIds(prev => {
        if (prev[activeNewsId]) return prev;
        const updated = { ...prev, [activeNewsId]: true };
        localStorage.setItem('read_news_ids_v1', JSON.stringify(updated));
        
        // Find news item category/title to make it highly informative
        const item = newsItems.find(x => x.id === activeNewsId);
        // if (item) {
        //   addToast(
        //     'Story Marked Read',
        //     `Progress updated for "${item.categoryName}".`,
        //     'success'
        //   );
        // }
        return updated;
      });
    }
  }, [activeNewsId, newsItems, addToast]);

  // Custom picker for adding custom dates
  const [customDateValue, setCustomDateValue] = useState('');
  const [showCustomDatePrompt, setShowCustomDatePrompt] = useState(false);
  const [isAiLoading, setIsAiLoading] = useState(false);
  const [apiNotice, setApiNotice] = useState<string | null>(null);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isVerticalFullscreenOpen, setIsVerticalFullscreenOpen] = useState(false);
  const [isHelpOpen, setIsHelpOpen] = useState(false);
  const [isProfileOpen, setIsProfileOpen] = useState(false);

  const handleLoadAIPortalNews = async () => {
    const targetDate = isSandboxMode ? sandboxActiveDate : selectedDate;
    if (!targetDate) {
      setErrorStatus("Please select or add a date tab first before loading news.");
      return;
    }

    setIsAiLoading(true);
    setErrorStatus(null);
    setApiNotice(null);

    try {
      if (isSandboxMode) {
        // Fetch strictly from our rich Sandbox dataset
        const filtered = sandboxNewsStore.filter(item => item.date === sandboxActiveDate);
        setNewsItems(filtered);
        if (filtered.length > 0) {
          const firstGlobal = filtered.find(x => x.level === 'Global');
          setActiveNewsId(firstGlobal ? firstGlobal.id : filtered[0].id);
        }
        setApiNotice(`Loaded dynamic Sandbox pre-categorized news successfully for date ${sandboxActiveDate}!`);
      } else {
        if (!authToken || !selectedSheetId) {
          throw new Error("No active Google Sheets connection. Connect Sheets first.");
        }
        
        // Step two: Fetch directly from the active Google Sheet tab
        console.log(`[Spreadsheet Fetch] Loading pre-categorized news from tab: ${targetDate}`);
        
        let items = [];
        try {
          items = await fetchNewsFromTab(authToken, selectedSheetId, targetDate);
        } catch (err) {
          console.log(`Tab ${targetDate} is empty or uninitialized. Seeding...`);
        }

        if (items.length === 0) {
          // Automatically seed the fresh tab with our beautiful pre-categorized sample dataset (TCS, Infosys, Wipro, etc)
          await populateTabWithSampleData(authToken, selectedSheetId, targetDate);
          items = await fetchNewsFromTab(authToken, selectedSheetId, targetDate);
          setApiNotice("Seeded empty Google Sheet date tab with pre-categorized news hierarchy and impact percentages!");
        } else {
          setApiNotice("Successfully synchronized pre-categorized news directly from Google Sheet!");
        }

        setNewsItems(items);
        if (items.length > 0) {
          const firstGlobal = items.find(x => x.level === 'Global');
          setActiveNewsId(firstGlobal ? firstGlobal.id : items[0].id);
        }
      }
    } catch (err: any) {
      console.error(err);
      setErrorStatus(err.message || 'Error occurred while loading Google Sheet News.');
    } finally {
      setIsAiLoading(false);
    }
  };

  // Format today's date
  const todayDateStr = useMemo(() => {
    const d = new Date();
    const pad = (n: number) => n.toString().padStart(2, '0');
    return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
  }, []);

  // Sync auth state and load shared configuration on boot
  useEffect(() => {
    addDiagnosticLog('Initializing main workspace loader...', 'info');

    const initSharedConfig = async () => {
      updateStep('env-config', 'loading');
      addDiagnosticLog('Querying backend server endpoint: GET /api/config', 'info');
      try {
        const localId = localStorage.getItem('custom_spreadsheet_id');
        const localGid = localStorage.getItem('custom_spreadsheet_gid') || '';
        if (localGid) {
          setSelectedGid(localGid);
        }
        if (localId) {
          setSharedSheetId(localId);
          setSelectedSheetId(localId);
          addDiagnosticLog(`Persisted LocalStorage custom spreadsheet discovered: [${localId.substring(0, 8)}...] (GID: ${localGid})`, 'info');
          updateStep('env-config', 'success', `Connected: Loaded custom local storage workbook ID ...${localId.substring(localId.length - 6)}`);
          return;
        }

        const res = await fetch('/api/config');
        if (res.ok) {
          const data = await res.json();
          if (data?.selectedSheetId) {
            setSharedSheetId(data.selectedSheetId);
            setSelectedSheetId(data.selectedSheetId);
            addDiagnosticLog(`Backend responded: Found default spreadsheet config id [${data.selectedSheetId.substring(0, 8)}...]`, 'info');
            updateStep('env-config', 'success', `Connected: Loaded default workbook ID ending in ...${data.selectedSheetId.substring(data.selectedSheetId.length - 6)}`);
          } else {
            addDiagnosticLog('Backend responded with no default spreadsheet configuration.', 'warn');
            updateStep('env-config', 'warn', 'Idle: Config did not contain a DEFAULT_SPREADSHEET_ID system environment variable.');
          }
        } else {
          addDiagnosticLog(`Backend config fetch returned unsuccessful status code ${res.status}`, 'error');
          updateStep('env-config', 'error', `HTTP ${res.status}: Server yielded an error webpage rather than configurations.`);
        }
      } catch (err: any) {
        console.error('Error loading default spreadsheet config:', err);
        addDiagnosticLog(`Failed to load server configure: ${err?.message || String(err)}`, 'error');
        updateStep('env-config', 'error', err?.message || 'Error occurred during network fetch of api/config endpoint.');
      }
    };

    const params = new URLSearchParams(window.location.search);
    if (params.get('admin') === 'true') {
      setIsAdminMode(true);
      addDiagnosticLog('Admin mode enabled from url parameter override query', 'info');
    }

    initSharedConfig();

    updateStep('firebase-auth', 'loading');
    updateStep('oauth-detect', 'loading');
    addDiagnosticLog('Initializing secure Google gateway & Firebase auth state listener...', 'info');

    const unsubscribe = initAuth(
      (user, token) => {
        setCurrentUser(user);
        setAuthToken(token);
        addDiagnosticLog(`Firebase authenticated successfully. Current email: ${user.email}`, 'info');
        updateStep('firebase-auth', 'success');
        updateStep('oauth-detect', 'success', `Credential loaded: Authenticated user (${user.email || 'Google User'})`);
        setIsAuthLoading(false);
      },
      () => {
        setCurrentUser(null);
        setAuthToken(null);
        addDiagnosticLog('No logged-in Google credentials discovered in active Firebase observer.', 'warn');
        updateStep('firebase-auth', 'success');
        updateStep('oauth-detect', 'warn', 'No cached Google Sheets token. Sandbox/Standard mode active.');
        setIsAuthLoading(false);
      }
    );

    // Safety fallback timer to prevent infinite loader loop if Firebase Auth network hangs
    const safetyTimer = setTimeout(() => {
      addDiagnosticLog('Firebase security connection safety timeout of 3500ms reached.', 'warn');
      setIsAuthLoading(false);
    }, 3500);

    return () => {
      unsubscribe();
      clearTimeout(safetyTimer);
    };
  }, []);

  // Keep sandbox mode off by default - pull only from google sheet
  useEffect(() => {
    if (!isAuthLoading) {
      if (!selectedSheetId && !currentUser) {
        setIsSandboxMode(false);
      }
    }
  }, [isAuthLoading, selectedSheetId, currentUser]);

  // Fetch spreadsheets once logged in
  useEffect(() => {
    if (authToken && !isSandboxMode) {
      loadSpreadsheetsList();
    }
  }, [authToken, isSandboxMode]);

  const loadSpreadsheetsList = async (forceSelectId?: string) => {
    if (!authToken) return;
    setLoadingSheets(true);
    setErrorStatus(null);
    updateStep('list-sheets', 'loading');
    addDiagnosticLog('Triggered search for spreadsheets. Connecting to Google Drive API...', 'info');
    try {
      const list = await listUserSpreadsheets(authToken);
      setSpreadsheets(list);
      addDiagnosticLog(`Successfully queried Drive API. Found ${list.length} spreadsheet workbooks.`, 'info');
      updateStep('list-sheets', 'success', `Connected: Found ${list.length} compatible spreadsheet workbooks on Google Drive.`);
      
      if (forceSelectId) {
        setSelectedSheetId(forceSelectId);
      } else if (list.length > 0) {
        setSelectedSheetId(prev => {
          if (prev && list.some(item => item.id === prev)) {
            return prev;
          }
          return list[0].id;
        });
      }
    } catch (err: any) {
      console.error(err);
      const errMsg = err.message || 'Failed listing spreadsheets in Drive.';
      setErrorStatus(errMsg);
      addDiagnosticLog(`Drive API connection failed or returned access error: ${errMsg}`, 'error');
      updateStep('list-sheets', 'error', errMsg);
    } finally {
      setLoadingSheets(false);
    }
  };

  // Fetch spreadsheet tabs metadata on selection
  useEffect(() => {
    if (authToken && selectedSheetId && !isSandboxMode) {
      loadSheetMetadata();
    } else if (!authToken && selectedSheetId && !isSandboxMode && !isAuthLoading) {
      loadPublicSheetMetadata(selectedSheetId);
    }
  }, [authToken, selectedSheetId, isSandboxMode, isAuthLoading]);

  const loadPublicSheetMetadata = async (sheetId: string) => {
    if (!sheetId) return;
    setLoadingSheets(true);
    setErrorStatus(null);
    updateStep('sheet-metadata', 'loading');
    addDiagnosticLog(`Accessing public metadata endpoint for sheet: ${sheetId.substring(0, 8)}...`, 'info');
    try {
      const res = await fetch(`/api/public-sheet-info?spreadsheetId=${sheetId}`);
      if (!res.ok) {
        let errMsg = `HTTP ${res.status}`;
        try {
          const errData = await res.json();
          if (errData && errData.error) {
            errMsg = errData.error;
          }
        } catch (_) {}
        throw new Error(errMsg);
      }
      const info = await res.json();
      setSheetInfo(info);
      if (info.tabs && info.tabs.length > 0) {
        setSelectedDate(info.tabs[0]); // newest date
        addDiagnosticLog(`Metadata resolved successfully via backend proxy. Discovered ${info.tabs.length} tabs: [${info.tabs.slice(0, 4).join(', ')}...]`, 'info');
        updateStep('sheet-metadata', 'success', `Validated structure: Loaded ${info.tabs.length} tabs from public container spreadsheet.`);
      } else {
        setSelectedDate(todayDateStr);
        addDiagnosticLog(`Metadata parsed empty tabs list for spreadsheet. Falling back to today date: ${todayDateStr}`, 'warn');
        updateStep('sheet-metadata', 'warn', `Workbook loaded but was empty (had zero sheets). Today's slot created: ${todayDateStr}`);
      }
    } catch (err: any) {
      console.warn('Metadata load failed:', err);
      const errMsg = err.message || 'Error parsing sheets schema metadata via server proxy.';
      setErrorStatus(`Google Sheet Connection Offline: ${errMsg}. Loading offline fallback.`);
      addDiagnosticLog(`Google Sheet restricted/missing: ${errMsg}. Auto-fallback active.`, 'warn');
      addToast(
        'Offline Auto-Fallback',
        'Google Sheet is restricted or missing. Auto-loading local sandbox dataset.',
        'info'
      );
      
      setIsSandboxMode(true);
      setSandboxNewsStore(SANDBOX_NEWS);
      setSandboxDates(['2026-06-19']);
      setSandboxActiveDate('2026-06-19');
      setNewsItems(SANDBOX_NEWS);
      setActiveNewsId(SANDBOX_NEWS.length > 0 ? SANDBOX_NEWS[0].id : null);
      updateStep('sheet-metadata', 'warn', 'Private or missing sheet detected. Applied sandbox fallback.');
    } finally {
      setLoadingSheets(false);
    }
  };

  const loadSheetMetadata = async () => {
    if (!authToken || !selectedSheetId) return;
    setLoadingSheets(true);
    setErrorStatus(null);
    updateStep('sheet-metadata', 'loading');
    addDiagnosticLog(`Invoking spreadsheet metadata read for workbook: ${selectedSheetId.substring(0, 8)}...`, 'info');
    try {
      const info = await fetchSpreadsheetInfo(authToken, selectedSheetId);
      setSheetInfo(info);
      if (info.tabs.length > 0) {
        setSelectedDate(info.tabs[0]); // newest date
        addDiagnosticLog(`Private workbook metadata resolved successfully. Tabs list: [${info.tabs.slice(0, 4).join(', ')}...]`, 'info');
        updateStep('sheet-metadata', 'success', `Connected & active: Structured metadata loaded (${info.tabs.length} sheets/dates registered).`);
      } else {
        // Automatically create and seed tab for today
        addDiagnosticLog(`Private workbook has no active tabs. Initiating automatic day-tab creation for today: ${todayDateStr}`, 'info');
        await handleAddNewDateTab(todayDateStr);
        addDiagnosticLog(`Created tab successfully for today's dynamic slot: ${todayDateStr}`, 'info');
        updateStep('sheet-metadata', 'success', `Initialized workbook structure and added dynamic tab descriptor for today.`);
      }
    } catch (err: any) {
      console.error(err);
      const errMsg = err.message || 'Error parsing sheets schema.';
      setErrorStatus(errMsg);
      addDiagnosticLog(`Metadata read failed: ${errMsg}`, 'error');
      updateStep('sheet-metadata', 'error', errMsg);

      const isAuthError = errMsg.includes('credential') || errMsg.includes('authentication') || errMsg.includes('token') || errMsg.includes('401') || errMsg.includes('Authorization');
      if (isAuthError) {
        addDiagnosticLog('Google session expired or token is invalid. Clearing expired token and falling back to public sheet connection...', 'warn');
        try {
          localStorage.removeItem('news_oauth_token');
          sessionStorage.removeItem('news_oauth_token');
        } catch (_) {}
        setAuthToken(null);
        setCurrentUser(null);
        addToast(
          'Session Expired',
          'Your Google login session expired. Falling back to public sheet viewing. Please Sign In again if you need to write records.',
          'warning'
        );
        loadPublicSheetMetadata(selectedSheetId);
      }
    } finally {
      setLoadingSheets(false);
    }
  };

  // Load news card items for selected tab/date OR dateRange shifts
  useEffect(() => {
    if (isSandboxMode) {
      const activeTime = new Date(sandboxActiveDate).getTime();
      let msOffset = 0;
      if (dateRange === '1week') msOffset = 7 * 24 * 60 * 60 * 1000;
      else if (dateRange === '1month') msOffset = 30 * 24 * 60 * 60 * 1000;
      else if (dateRange === '1quarter') msOffset = 90 * 24 * 60 * 60 * 1000;

      const filtered = sandboxNewsStore.filter(item => {
        if (dateRange === '1day') return item.date === sandboxActiveDate;
        const tabTime = new Date(item.date).getTime();
        if (isNaN(tabTime)) return false;
        return tabTime <= activeTime && (activeTime - tabTime) <= msOffset;
      });

      // Map unique composite keys if multi-date sandbox is loaded to allow duplicate IDs across dates to exist together
      const processed = filtered.map(item => {
        if (dateRange === '1day') return item;
        return {
          ...item,
          id: `${item.id}_${item.date}`,
          parentId: item.parentId ? `${item.parentId}_${item.date}` : null,
          categoryName: `${item.categoryName} (${item.date})`
        };
      });

      setNewsItems(processed);
      if (processed.length > 0) {
        const firstGlobal = processed.find(x => x.level === 'Global');
        setActiveNewsId(firstGlobal ? firstGlobal.id : processed[0].id);
      } else {
        setActiveNewsId(null);
      }
    } else if (authToken && selectedSheetId && selectedDate) {
      loadNewsItemsFromSheet();
    } else if (!authToken && selectedSheetId && selectedDate && !isAuthLoading) {
      loadPublicNewsItems(selectedSheetId, selectedDate);
    }
  }, [authToken, selectedSheetId, selectedDate, dateRange, isSandboxMode, isAuthLoading, sandboxActiveDate, sandboxNewsStore]);

  const loadNewsItemsFromSheet = async () => {
    if (!authToken || !selectedSheetId || !selectedDate) return;
    setIsSyncing(true);
    setErrorStatus(null);
    try {
      // Find all tabs matching selected date range from current active date
      let targetTabs = [selectedDate];
      if (dateRange !== '1day' && sheetInfo && sheetInfo.tabs && sheetInfo.tabs.length > 0) {
        const activeTime = new Date(selectedDate).getTime();
        let msOffset = 0;
        if (dateRange === '1week') msOffset = 7 * 24 * 60 * 60 * 1000;
        else if (dateRange === '1month') msOffset = 30 * 24 * 60 * 60 * 1000;
        else if (dateRange === '1quarter') msOffset = 90 * 24 * 60 * 60 * 1000;

        if (!isNaN(activeTime)) {
          targetTabs = sheetInfo.tabs.filter(tab => {
            const tabTime = new Date(tab).getTime();
            if (isNaN(tabTime)) return false;
            return tabTime <= activeTime && (activeTime - tabTime) <= msOffset;
          });
        }
      }

      // Query all matching tabs in parallel
      const fetchPromises = targetTabs.map(async (tabName) => {
        try {
          const items = await fetchNewsFromTab(authToken, selectedSheetId, tabName);
          return items;
        } catch (colErr) {
          console.warn(`Could not read items from tab ${tabName}:`, colErr);
          return [];
        }
      });

      const results = await Promise.all(fetchPromises);
      const merged = results.flat();

      // Ensure stable parents by updating hierarchical bindings if duplicate IDs occur across days
      const processed = merged.map(item => {
        if (targetTabs.length <= 1) return item;
        return {
          ...item,
          id: `${item.id}_${item.date}`,
          parentId: item.parentId ? `${item.parentId}_${item.date}` : null,
          categoryName: `${item.categoryName} (${item.date})`
        };
      });

      setNewsItems(processed);

      if (processed.length > 0) {
        const firstGlobal = processed.find(x => x.level === 'Global');
        setActiveNewsId(firstGlobal ? firstGlobal.id : processed[0].id);
      } else {
        setActiveNewsId(null);
      }
    } catch (err: any) {
      console.error(err);
      const errMsg = err.message || '';
      setErrorStatus(errMsg || 'Could not load rows from designated sheet date tabs.');

      const isAuthError = errMsg.includes('credential') || errMsg.includes('authentication') || errMsg.includes('token') || errMsg.includes('401') || errMsg.includes('Authorization');
      if (isAuthError) {
        addDiagnosticLog('Google session expired inside news list reader. Clearing credentials and falling back to public content query...', 'warn');
        try {
          localStorage.removeItem('news_oauth_token');
          sessionStorage.removeItem('news_oauth_token');
        } catch (_) {}
        setAuthToken(null);
        setCurrentUser(null);
        addToast(
          'Session Expired',
          'Your Google login session expired. Falling back to public content query.',
          'warning'
        );
        loadPublicNewsItems(selectedSheetId, selectedDate);
      }
    } finally {
      setIsSyncing(false);
    }
  };

  const fetchPublicNewsFromTab = async (spreadsheetId: string, dateStr: string): Promise<NewsItem[]> => {
    try {
      const gidParam = selectedGid ? `&gid=${selectedGid}` : '';
      const res = await fetch(`/api/public-sheet-news?spreadsheetId=${spreadsheetId}&date=${encodeURIComponent(dateStr)}${gidParam}`);
      if (!res.ok) {
        let errMsg = `HTTP ${res.status}`;
        try {
          const errData = await res.json();
          if (errData && errData.error) {
            errMsg = errData.error;
          }
        } catch (_) {}
        throw new Error(errMsg);
      }
      const data = await res.json();
      if (data && data.success === false) {
        throw new Error(data.error || 'Failed to fetch news columns from Sheet.');
      }
      return data.newsItems || [];
    } catch (err) {
      console.error('Error fetching public tab news:', err);
      throw err;
    }
  };

  const loadPublicNewsItems = async (sheetId: string, activeDate: string) => {
    if (!sheetId || !activeDate) return;
    setIsSyncing(true);
    setErrorStatus(null);
    try {
      let targetTabs = [activeDate];
      if (dateRange !== '1day' && sheetInfo && sheetInfo.tabs && sheetInfo.tabs.length > 0) {
        const activeTime = new Date(activeDate).getTime();
        let msOffset = 0;
        if (dateRange === '1week') msOffset = 7 * 24 * 60 * 60 * 1000;
        else if (dateRange === '1month') msOffset = 30 * 24 * 60 * 60 * 1000;
        else if (dateRange === '1quarter') msOffset = 90 * 24 * 60 * 60 * 1000;

        if (!isNaN(activeTime)) {
          targetTabs = sheetInfo.tabs.filter(tab => {
            const tabTime = new Date(tab).getTime();
            if (isNaN(tabTime)) return false;
            return tabTime <= activeTime && (activeTime - tabTime) <= msOffset;
          });
        }
      }

      const fetchPromises = targetTabs.map(async (tabName) => {
        return fetchPublicNewsFromTab(sheetId, tabName);
      });

      const results = await Promise.all(fetchPromises);
      const merged = results.flat();

      const processed = merged.map(item => {
        if (targetTabs.length <= 1) return item;
        return {
          ...item,
          id: `${item.id}_${item.date}`,
          parentId: item.parentId ? `${item.parentId}_${item.date}` : null,
          categoryName: `${item.categoryName} (${item.date})`
        };
      });

      setNewsItems(processed);
      if (processed.length > 0) {
        const firstGlobal = processed.find(x => x.level === 'Global');
        setActiveNewsId(firstGlobal ? firstGlobal.id : processed[0].id);
      } else {
        setActiveNewsId(null);
      }
    } catch (err: any) {
      console.warn('Public news loading failed:', err);
      setErrorStatus(`Google Sheet News Fetch Error: ${err.message || String(err)}.`);
      addDiagnosticLog(`Public news loader failed: ${err.message}. Applying fallback...`, 'warn');
      addToast(
        'Offline Auto-Fallback',
        'Google Sheet news loading restricted. Auto-loading sample database.',
        'info'
      );
      
      setIsSandboxMode(true);
      setSandboxNewsStore(SANDBOX_NEWS);
      setSandboxDates(['2026-06-19']);
      setSandboxActiveDate('2026-06-19');
      setNewsItems(SANDBOX_NEWS);
      setActiveNewsId(SANDBOX_NEWS.length > 0 ? SANDBOX_NEWS[0].id : null);
    } finally {
      setIsSyncing(false);
    }
  };

  const handleGenerateLiveNews = async () => {
    const targetDate = isSandboxMode ? sandboxActiveDate : selectedDate;
    if (!targetDate) {
      addToast('No Date Selected', 'Please select or add a date tab first.', 'error');
      return;
    }

    setIsAiLoading(true);
    addToast('Contacting AI Portal', 'Harvesting fresh financial headlines via Google Search Grounding...', 'info');
    setErrorStatus(null);
    setApiNotice(null);

    try {
      const response = await fetch('/api/generate-news', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ dateStr: targetDate })
      });

      if (!response.ok) {
        throw new Error(`AI Portal returned status ${response.status}`);
      }

      const result = await response.json();
      if (!result.success || !result.newsItems) {
        throw new Error(result.error || 'Failed to generate news hierarchy.');
      }

      const generatedItems: NewsItem[] = result.newsItems.map((item: any) => ({
        ...item,
        date: targetDate
      }));

      if (isSandboxMode) {
        // Update local sandbox store
        setSandboxNewsStore(prev => {
          const rest = prev.filter(x => x.date !== targetDate);
          return [...rest, ...generatedItems];
        });
        setNewsItems(generatedItems);
        if (generatedItems.length > 0) {
          const firstGlobal = generatedItems.find(x => x.level === 'Global');
          setActiveNewsId(firstGlobal ? firstGlobal.id : generatedItems[0].id);
        }
        addToast('Success', 'Harvested and loaded fresh live news for Sandbox date!', 'success');
        if (result.notice) {
          setApiNotice(result.notice);
        } else {
          setApiNotice('Successfully generated live hierarchical news with Gemini AI search grounding.');
        }
      } else {
        if (!authToken || !selectedSheetId) {
          throw new Error("No active Google Sheets connection. Connect Sheets first.");
        }
        // Write/Overwrite sheet tab with AI stories
        addToast('Writing Database', 'Synchronizing fresh AI stories to Google Sheet...', 'info');
        await overwriteTabWithAIStories(authToken, selectedSheetId, targetDate, generatedItems);
        
        // Reload from sheet to confirm
        const items = await fetchNewsFromTab(authToken, selectedSheetId, targetDate);
        setNewsItems(items);
        if (items.length > 0) {
          const firstGlobal = items.find(x => x.level === 'Global');
          setActiveNewsId(firstGlobal ? firstGlobal.id : items[0].id);
        }
        addToast('Success', 'Successfully updated Google Sheet database with fresh live news!', 'success');
        setApiNotice('Synchronized live hierarchical news from Gemini search grounding directly into Google Sheets.');
      }
    } catch (err: any) {
      console.error(err);
      addToast('AI Generation Failed', err.message || 'Error occurred.', 'error');
      setErrorStatus(err.message || 'Error occurred while loading live AI News.');
    } finally {
      setIsAiLoading(false);
    }
  };

  const handleRefreshFeed = async () => {
    setIsSyncing(true);
    addToast('Refreshing Feed', 'Loading fresh stories from live database...', 'info');
    try {
      if (isSandboxMode) {
        // Just reload sandbox
        const filtered = sandboxNewsStore.filter(item => item.date === sandboxActiveDate);
        setNewsItems(filtered);
        addToast('Synced', 'Sandbox news database reloaded.', 'success');
      } else if (authToken && selectedSheetId) {
        // Re-read metadata first to see if any new tabs/days exist
        try {
          const info = await fetchSpreadsheetInfo(authToken, selectedSheetId);
          setSheetInfo(info);
        } catch (e) {
          console.warn("Failed to update sheet metadata during refresh:", e);
        }
        await loadNewsItemsFromSheet();
        addToast('Synced', 'Successfully synchronized latest stories from Google Sheet.', 'success');
      } else if (selectedSheetId && selectedDate) {
        await loadPublicNewsItems(selectedSheetId, selectedDate);
        addToast('Synced', 'Refreshed public container feed.', 'success');
      } else {
        setNewsItems(SANDBOX_NEWS);
        addToast('Synced', 'Reloaded default seed news feed.', 'success');
      }
    } catch (err: any) {
      addToast('Sync Failed', err?.message || 'Could not synchronize.', 'error');
    } finally {
      setIsSyncing(false);
    }
  };

  // Sign in to Google
  const handleSignIn = async () => {
    setErrorStatus(null);
    try {
      const res = await googleSignIn();
      if (res) {
        setCurrentUser(res.user);
        setAuthToken(res.accessToken);
        setIsSandboxMode(false);
      }
    } catch (err: any) {
      console.error(err);
      setErrorStatus(err.message || 'Login failed.');
    }
  };

  // Sign out
  const handleSignOut = async () => {
    try {
      await logout();
    } catch (e) {
      console.warn("Logout error handled gracefully:", e);
    }
    setCurrentUser(null);
    setAuthToken(null);
    setIsSandboxMode(false);
    setNewsItems([]);
    setActiveNewsId(null);
  };

  // Mock / switch accounts for instant developer role testing
  const handleSwitchToTestAdmin = () => {
    setCurrentUser({
      uid: 'test-admin-uid',
      email: 'saurabhsks01@gmail.com',
      displayName: 'Testing Administrator',
      photoURL: null
    });
    setAuthToken('mock-admin-token');
    setIsAdminMode(true);
    setIsSandboxMode(false);
    setIsProfileOpen(false);
    addToast('Test Admin Activated', 'Switched session context to Administrator role.', 'success');
  };

  const handleSwitchToTestReader = () => {
    setCurrentUser({
      uid: 'test-reader-uid',
      email: 'dummy.reader@newsapp.com',
      displayName: 'Dummy Testing Reader',
      photoURL: null
    });
    setAuthToken('mock-reader-token');
    setIsAdminMode(false);
    setIsSandboxMode(false);
    setIsProfileOpen(false);
    addToast('Test Reader Activated', 'Switched session context to Normal Reader role.', 'success');
  };

  // Create totally new spreadsheet
  const handleCreateNewSheet = async () => {
    if (!authToken) return;
    setLoadingSheets(true);
    setErrorStatus(null);
    try {
      const newId = await createNewSpreadsheet(
        authToken,
        'Hierarchy News Daily Log',
        todayDateStr
      );
      setSelectedSheetId(newId);
      // Refresh list to pull files from Drive & populate spreadsheets dropdown/info
      await loadSpreadsheetsList(newId);
    } catch (err: any) {
      console.error(err);
      setErrorStatus(err.message || 'Failed to initialize a new spreadsheet.');
    } finally {
      setLoadingSheets(false);
    }
  };

  // Create new tabular tab/date
  const handleAddNewDateTab = async (dateStr: string) => {
    if (isSandboxMode) return;
    if (!authToken || !selectedSheetId) return;
    setIsSyncing(true);
    try {
      await createNewTab(authToken, selectedSheetId, dateStr);
      // Reload spreadsheet properties
      const info = await fetchSpreadsheetInfo(authToken, selectedSheetId);
      setSheetInfo(info);
      setSelectedDate(dateStr);
    } catch (err: any) {
      console.error(err);
      let errMsg = err.message || '';
      if (errMsg.includes('credential') || errMsg.includes('authentication') || errMsg.includes('token') || errMsg.includes('401') || errMsg.includes('Authorization')) {
        errMsg = "Google Sheet Write Access Failed: Your Google login session has expired or lacks sufficient write permissions. Please Sign In using Google at the bottom of Settings to write records.";
      } else {
        errMsg = `Failed adding a date tab: ${errMsg}`;
      }
      setErrorStatus(errMsg);
    } finally {
      setIsSyncing(false);
    }
  };

  const handleBulkSeedPastWeek = async () => {
    setIsSyncing(true);
    setErrorStatus(null);
    setApiNotice(null);

    const label = seedDurationDays === 30 ? '30 days (2,200+ stories)' : '7 days (500+ stories)';

    if (isSandboxMode) {
      try {
        console.log(`[Sandbox Seeding] Simulating ${label} locally...`);
        // Use active date as the baseline
        const generated = generateLastWeek500News(sandboxActiveDate, seedDurationDays);
        setSandboxNewsStore(generated);
        
        // Find unique dates and arrange chronologically (newest first)
        const uniqDates = Array.from(new Set(generated.map(x => x.date))).sort((a, b) => b.localeCompare(a));
        setSandboxDates(uniqDates);
        setSandboxActiveDate(uniqDates[0]);
        
        setApiNotice(`Successfully simulated ${seedDurationDays} days of timeline history with ${generated.length} pre-categorized news items in Sandbox mode memory! Try selecting dates inside Settings!`);
        addToast(
          'Seeding Success',
          `Generated ${seedDurationDays} daily timeline sheets with ${generated.length} news items locally.`,
          'success'
        );
      } catch (err: any) {
        console.error(err);
        setErrorStatus(err.message || 'Error simulating sandbox data.');
        addToast('Seeding Failed', 'Local sandbox news generation failed.', 'error');
      } finally {
        setIsSyncing(false);
      }
      return;
    }

    if (!authToken || !selectedSheetId) {
      setErrorStatus("Please connect Google Sheets first before seeding the database.");
      setIsSyncing(false);
      return;
    }

    try {
      console.log(`[Google Sheet Seeding] Seeding ${label} across tabs to Google Sheet...`);
      const seeded = await seed500PastWeekNews(authToken, selectedSheetId, seedDurationDays);
      
      // Reload sheet attributes
      const info = await fetchSpreadsheetInfo(authToken, selectedSheetId);
      setSheetInfo(info);
      if (seeded.length > 0) {
        setSelectedDate(seeded[0]); // Select newest date
        setApiNotice(`Successfully populated ${seeded.length} daily tabs with robust, pre-categorized news stories in your active Google Sheet!`);
        addToast(
          'Sheets Bulk Seeded',
          `Wrote ${seeded.length} tabular daily sheets with news hierarchy to Google Sheets.`,
          'success'
        );
      } else {
        throw new Error("Failed to populate any sheet tabs.");
      }
    } catch (err: any) {
      console.error(err);
      let errMsg = err.message || '';
      if (errMsg.includes('credential') || errMsg.includes('authentication') || errMsg.includes('token') || errMsg.includes('401') || errMsg.includes('Authorization')) {
        errMsg = "Google Sheet Write Access Failed: Your Google login session has expired or lacks sufficient write permissions. Please Sign In using Google at the bottom of Settings to write records.";
      } else {
        errMsg = `Error occurred during ${seedDurationDays}-day bulk seeder: ${errMsg}`;
      }
      setErrorStatus(errMsg);
      addToast('Sheets Seeding Failed', `Authorized Google connection or Sandbox Mode required.`, 'error');
    } finally {
      setIsSyncing(false);
    }
  };

  const handleCustomDateSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!/^\d{4}-\d{2}-\d{2}$/.test(customDateValue)) {
      alert('Date must be formatted in YYYY-MM-DD format (e.g. 2026-06-20)');
      return;
    }
    await handleAddNewDateTab(customDateValue);
    setShowCustomDatePrompt(false);
    setCustomDateValue('');
  };

  // Submits a news node to Sheets or local state sandbox
  const handleAddNewsItem = async (itemFields: Omit<NewsItem, 'date'>) => {
    const defaultDate = isSandboxMode ? sandboxActiveDate : selectedDate;
    const fullItem: NewsItem = {
      ...itemFields,
      date: defaultDate
    };

    if (isSandboxMode) {
      setSandboxNewsStore(prev => [...prev, fullItem]);
      setNewsItems(prev => [...prev, fullItem]);
      return;
    }

    if (!authToken || !selectedSheetId || !selectedDate) {
      throw new Error('No spreadsheet synced to write news properties.');
    }

    setIsSyncing(true);
    try {
      await appendNewsToTab(authToken, selectedSheetId, selectedDate, [fullItem]);
      // Reload news rows to sync views
      await loadNewsItemsFromSheet();
    } finally {
      setIsSyncing(false);
    }
  };

  // Resolve current active news item mapping
  const activeItem = useMemo(() => {
    return newsItems.find(x => x.id === activeNewsId) || null;
  }, [newsItems, activeNewsId]);

  // Active branch items
  const activeBranchItems = useMemo(() => {
    if (!activeItem) return [];
    return getDescendantsAndSelf(activeItem, newsItems);
  }, [activeItem, newsItems]);

  const activeBranchTotalCount = activeBranchItems.length;
  // Unread items are items that are NOT in readNewsIds
  const activeBranchUnreadCount = useMemo(() => {
    return activeBranchItems.filter(x => !readNewsIds[x.id]).length;
  }, [activeBranchItems, readNewsIds]);

  const progressPercent = useMemo(() => {
    if (activeBranchTotalCount === 0) return 0;
    const readCount = activeBranchTotalCount - activeBranchUnreadCount;
    return (readCount / activeBranchTotalCount) * 100;
  }, [activeBranchTotalCount, activeBranchUnreadCount]);

  // Stats indicating unread/total count at current level and levels below current level
  const currentAndBelowStats = useMemo(() => {
    if (!activeItem) return { unread: 0, total: 0 };
    const currentLevIdx = HIERARCHY_ORDER.indexOf(activeItem.level);
    if (currentLevIdx === -1) return { unread: 0, total: 0 };
    
    // Filter news items that are at current level or below
    const targetItems = newsItems.filter(item => {
      const itemLevIdx = HIERARCHY_ORDER.indexOf(item.level);
      return itemLevIdx !== -1 && itemLevIdx >= currentLevIdx;
    });

    const total = targetItems.length;
    const unread = targetItems.filter(item => !readNewsIds[item.id]).length;

    return { unread, total };
  }, [activeItem, newsItems, readNewsIds]);

  const totalUnreadCount = useMemo(() => {
    return newsItems.filter(x => !readNewsIds[x.id]).length;
  }, [newsItems, readNewsIds]);

  // Compute navigation metrics & lists on the selected card
  const breadcrumbs = useMemo(() => {
    if (!activeItem) return [];
    return getBreadcrumbs(activeItem, newsItems);
  }, [activeItem, newsItems]);

  const spreadsheetUrls = useMemo(() => {
    const currentId = selectedSheetId || 'e/2PACX-1vSesHAf2i4cSydOiMSszcwC1sRz7yh6tiyVSQqbgAtnczqjqlwNhuw4nM-yjCeYL4OHNQkUq1y2K0t6';
    const isPublished = currentId.startsWith('e/') || currentId.includes('2PACX-') || currentId.includes('e/2PACX-');
    const userEmail = currentUser?.email;

    const authQuery = userEmail ? `?authuser=${encodeURIComponent(userEmail)}` : '';
    const authQueryWithAmp = userEmail ? `&authuser=${encodeURIComponent(userEmail)}` : '';

    if (isPublished) {
      const idWithPrefix = currentId.startsWith('e/') ? currentId : `e/${currentId}`;
      const pureId = currentId.startsWith('e/') ? currentId.substring(2) : currentId;
      return {
        viewUrl: `https://docs.google.com/spreadsheets/d/${idWithPrefix}/pubhtml${authQuery}`,
        downloadXlsx: `https://docs.google.com/spreadsheets/d/e/${pureId}/pub?output=xlsx${authQueryWithAmp}`,
        downloadCsv: `https://docs.google.com/spreadsheets/d/e/${pureId}/pub?output=csv${authQueryWithAmp}`
      };
    } else {
      return {
        viewUrl: `https://docs.google.com/spreadsheets/d/${currentId}/edit${authQuery}`,
        downloadXlsx: `https://docs.google.com/spreadsheets/d/${currentId}/export?format=xlsx${authQueryWithAmp}`,
        downloadCsv: `https://docs.google.com/spreadsheets/d/${currentId}/export?format=csv${authQueryWithAmp}`
      };
    }
  }, [selectedSheetId, currentUser]);

  const levelNodes = useMemo(() => {
    if (!activeItem) return [];
    if (activeItem.level === 'Stock') {
      // Find other stocks that share the same CapGroup AND same parent Industry branch!
      return newsItems.filter(x => x.level === 'Stock' && x.capGroup === activeItem.capGroup && x.parentId === activeItem.parentId);
    }
    // For other levels, find other items at the exact same level with the exact same parentId!
    return newsItems.filter(x => x.level === activeItem.level && x.parentId === activeItem.parentId);
  }, [activeItem, newsItems]);

  const activeLevelIndex = useMemo(() => {
    if (!activeItem || levelNodes.length === 0) return -1;
    return levelNodes.findIndex(x => x.id === activeItem.id);
  }, [activeItem, levelNodes]);

  const childNodes = useMemo(() => {
    if (!activeItem) return [];
    return getChildNodes(activeItem, newsItems);
  }, [activeItem, newsItems]);

  const parentNode = useMemo(() => {
    if (!activeItem) return null;
    return getParentNode(activeItem, newsItems);
  }, [activeItem, newsItems]);

  const hasDeeperLevel = useMemo(() => {
    if (!activeItem) return false;
    if (activeItem.level === 'Stock') {
      if (activeItem.capGroup === 'Large') {
        return newsItems.some(x => x.level === 'Stock' && x.capGroup === 'Mid' && x.parentId === activeItem.parentId);
      }
      if (activeItem.capGroup === 'Mid') {
        return newsItems.some(x => x.level === 'Stock' && x.capGroup === 'Small' && x.parentId === activeItem.parentId);
      }
      return false; // Small cap is bottom
    }
    if (childNodes.length > 0) return true;
    const currentIndex = HIERARCHY_ORDER.indexOf(activeItem.level);
    if (currentIndex < HIERARCHY_ORDER.length - 1) {
      const nextLevel = HIERARCHY_ORDER[currentIndex + 1];
      return newsItems.some(x => x.level === nextLevel && x.parentId === activeItem.id);
    }
    return false;
  }, [activeItem, childNodes, newsItems]);

  const hasAboveLevel = useMemo(() => {
    if (!activeItem) return false;
    if (activeItem.level === 'Stock') {
      if (activeItem.capGroup === 'Small') {
        return newsItems.some(x => x.level === 'Stock' && x.capGroup === 'Mid' && x.parentId === activeItem.parentId);
      }
      if (activeItem.capGroup === 'Mid') {
        return newsItems.some(x => x.level === 'Stock' && x.capGroup === 'Large' && x.parentId === activeItem.parentId);
      }
      // Large cap goes to Parent (Industry level - NIFTYITBEES / IT services)
      return !!parentNode;
    }
    if (parentNode) return true;
    const currentIndex = HIERARCHY_ORDER.indexOf(activeItem.level);
    if (currentIndex > 0) {
      const prevLevel = HIERARCHY_ORDER[currentIndex - 1];
      return newsItems.some(x => x.level === prevLevel && x.id === activeItem.parentId);
    }
    return false;
  }, [activeItem, parentNode, newsItems]);

  // Directional actions mapping Inshorts gestures & controls
  const handleScrollUp = useCallback(() => {
    if (activeLevelIndex > 0) {
      setActiveNewsId(levelNodes[activeLevelIndex - 1].id);
    }
  }, [activeLevelIndex, levelNodes]);

  const handleScrollDown = useCallback(() => {
    if (activeLevelIndex !== -1 && activeLevelIndex < levelNodes.length - 1) {
      setActiveNewsId(levelNodes[activeLevelIndex + 1].id);
    }
  }, [activeLevelIndex, levelNodes]);

  const handleGoDeeper = useCallback(() => {
    if (!activeItem) return;
    
    // If we are at Stock level, navigate down cap classes:
    if (activeItem.level === 'Stock') {
      if (activeItem.capGroup === 'Large') {
        const midStocks = newsItems.filter(x => x.level === 'Stock' && x.capGroup === 'Mid' && x.parentId === activeItem.parentId);
        if (midStocks.length > 0) {
          setActiveNewsId(midStocks[0].id);
          return;
        }
      } else if (activeItem.capGroup === 'Mid') {
        const smallStocks = newsItems.filter(x => x.level === 'Stock' && x.capGroup === 'Small' && x.parentId === activeItem.parentId);
        if (smallStocks.length > 0) {
          setActiveNewsId(smallStocks[0].id);
          return;
        }
      }
      return; // Small cap is bottom-most
    }

    // Otherwise standard hierarchical descent:
    // 1. Try direct hierarchical children first
    if (childNodes.length > 0) {
      setActiveNewsId(childNodes[0].id);
      return;
    }

    // 2. Fallback: Find general adjacent next level down under current activeItem
    const currentIndex = HIERARCHY_ORDER.indexOf(activeItem.level);
    if (currentIndex < HIERARCHY_ORDER.length - 1) {
      const nextLevel = HIERARCHY_ORDER[currentIndex + 1];
      const itemsAtNextLevel = newsItems.filter(x => x.level === nextLevel && x.parentId === activeItem.id);
      if (itemsAtNextLevel.length > 0) {
        setActiveNewsId(itemsAtNextLevel[0].id);
      }
    }
  }, [activeItem, childNodes, newsItems]);

  const handleGoAbove = useCallback(() => {
    if (!activeItem) return;

    // If we are at Stock level, navigate up cap classes, then to parent:
    if (activeItem.level === 'Stock') {
      if (activeItem.capGroup === 'Small') {
        const midStocks = newsItems.filter(x => x.level === 'Stock' && x.capGroup === 'Mid' && x.parentId === activeItem.parentId);
        if (midStocks.length > 0) {
          setActiveNewsId(midStocks[0].id);
          return;
        }
      } else if (activeItem.capGroup === 'Mid') {
        const largeStocks = newsItems.filter(x => x.level === 'Stock' && x.capGroup === 'Large' && x.parentId === activeItem.parentId);
        if (largeStocks.length > 0) {
          setActiveNewsId(largeStocks[0].id);
          return;
        }
      } else if (activeItem.capGroup === 'Large') {
        if (parentNode) {
          setActiveNewsId(parentNode.id);
          return;
        }
        const indItems = newsItems.filter(x => x.level === 'Industry' && x.id === activeItem.parentId);
        if (indItems.length > 0) {
          setActiveNewsId(indItems[0].id);
          return;
        }
      }
    }

    // Otherwise standard hierarchical ascent:
    // 1. Try direct hierarchical parent first
    if (parentNode) {
      setActiveNewsId(parentNode.id);
      return;
    }

    // 2. Fallback: Find general adjacent previous level up for the activeItem parentId
    const currentIndex = HIERARCHY_ORDER.indexOf(activeItem.level);
    if (currentIndex > 0) {
      const prevLevel = HIERARCHY_ORDER[currentIndex - 1];
      const itemsAtPrevLevel = newsItems.filter(x => x.level === prevLevel && x.id === activeItem.parentId);
      if (itemsAtPrevLevel.length > 0) {
        setActiveNewsId(itemsAtPrevLevel[0].id);
      }
    }
  }, [activeItem, parentNode, newsItems]);

  // Keybinding navigation support (Up/Down/Left/Right/PageUp/PageDown/Escape)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Ignore key events inside inputs/textareas to prevent collision
      const tag = (e.target as HTMLElement).tagName.toUpperCase();
      if (tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT') return;

      switch (e.key) {
        case 'Escape':
          if (isVerticalFullscreenOpen) {
            setIsVerticalFullscreenOpen(false);
          }
          break;
        case 'ArrowUp':
          e.preventDefault();
          handleScrollUp();
          break;
        case 'ArrowDown':
          e.preventDefault();
          handleScrollDown();
          break;
        case 'ArrowLeft':
          e.preventDefault();
          handleGoAbove(); // Above Level
          break;
        case 'ArrowRight':
          e.preventDefault();
          handleGoDeeper(); // Deeper Level
          break;
        default:
          break;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleScrollUp, handleScrollDown, handleGoDeeper, handleGoAbove, isVerticalFullscreenOpen]);

  // UI rendering helper
  if (isAuthLoading) {
    return (
      <div className="min-h-screen bg-[#FDFCFB] text-stone-900 flex flex-col items-center justify-center font-sans">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="w-8 h-8 animate-spin text-red-700" />
          <span className="text-[10px] uppercase font-extrabold tracking-widest text-stone-500">Loading hierarchy news...</span>
        </div>
      </div>
    );
  }

  // Legacy Diagnostics block bypassed
  const renderLegacyDiagnostics = () => {
    return (
      <>
      <div>
        {/* Diagnostic Top Header */}
        <header className="border-b border-stone-200 bg-white py-4 px-6 shadow-sm">
          <div className="max-w-5xl mx-auto flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-red-50 border border-red-200 rounded-lg flex items-center justify-center animate-pulse">
                <Activity className="w-5 h-5 text-red-700 font-bold" />
              </div>
              <div>
                <h1 className="text-sm uppercase font-extrabold tracking-widest text-stone-900">System Startup Diagnostics</h1>
                <p className="text-[10px] text-stone-500 font-mono mt-1 font-semibold">WORKSPACE INTEGRATION & INTEGRITY PIPELINE</p>
              </div>
            </div>
            
            <div className="flex items-center gap-2">
              <button
                onClick={() => {
                  // Reset steps
                  setInitSteps([
                    { id: 'env-config', label: 'Backend Server Config', description: 'Querying /api/config for default workbook ID', status: 'idle' },
                    { id: 'firebase-auth', label: 'Firebase Auth Gateway', description: 'Checking Firebase server auth initialized state', status: 'idle' },
                    { id: 'oauth-detect', label: 'Google Workspace Credentials', description: 'Checking browser cache/session for Google token', status: 'idle' },
                    { id: 'list-sheets', label: 'Google Sheets Connection', description: 'Quering workbook files list from authorized Drive API', status: 'idle' },
                    { id: 'sheet-metadata', label: 'Workbook Structural Validation', description: 'Pulling and loading days/tabs headers from the active sheet', status: 'idle' }
                  ]);
                  setDiagnosticsLogs([]);
                  addDiagnosticLog('Re-triggering Workspace integrity authentication pipeline checks...', 'info');
                  setIsAuthLoading(true);
                  // Refresh endpoint config
                  fetch('/api/config')
                    .then(res => {
                      updateStep('env-config', 'loading');
                      if (res.ok) {
                        return res.json();
                      }
                      throw new Error(`HTTP Fetch returned error index status ${res.status}`);
                    })
                    .then(data => {
                      if (data?.selectedSheetId) {
                        setSharedSheetId(data.selectedSheetId);
                        setSelectedSheetId(data.selectedSheetId);
                        addDiagnosticLog(`Successful configuration pull: [${data.selectedSheetId.substring(0,8)}...]`, 'info');
                        updateStep('env-config', 'success', `Loaded default workbook ID: ...${data.selectedSheetId.substring(data.selectedSheetId.length-6)}`);
                      } else {
                        updateStep('env-config', 'warn', 'No DEFAULT_SPREADSHEET_ID set in system ENV variables.');
                      }
                    })
                    .catch(err => {
                      updateStep('env-config', 'error', err?.message || 'Failed connecting to API gateway configuration.');
                    });
                }}
                className="inline-flex items-center gap-2 px-3 py-1.5 bg-white hover:bg-stone-50 text-stone-800 text-[10px] font-mono uppercase tracking-wider rounded border border-stone-300 shadow-sm transition-all cursor-pointer"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                <span>Re-Check Pipeline</span>
              </button>

              <button
                onClick={() => {
                  setIsAuthLoading(false);
                  setIsSandboxMode(true);
                }}
                className="inline-flex items-center gap-1 px-3 py-1.5 bg-stone-900 hover:bg-black text-white text-[10px] font-mono uppercase tracking-wider rounded border border-black shadow transition-all cursor-pointer"
              >
                <span>Bypass to Sandbox</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        </header>

        {/* Diagnostic Workspace Grid */}
        <main className="flex-1 max-w-5xl w-full mx-auto p-4 sm:p-6 grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          
          {/* LEFT: Live Flowchart Checklist (Span 7) */}
          <section className="lg:col-span-7 bg-white rounded-xl border border-stone-200 p-5 shadow-sm">
            <h2 className="text-xs uppercase font-extrabold tracking-widest text-[#9A3412] mb-5 flex items-center gap-2">
              <Network className="w-4 h-4 text-orange-700" />
              <span>LIVE INTERACTIVE PIPELINE FLOWCHART</span>
            </h2>

            <div className="relative pl-1">
              {/* Connected Line Background */}
              <div className="absolute top-2 left-6 bottom-4 w-0.5 bg-stone-100 border-l border-dashed border-stone-200 z-0"></div>

              {/* Steps Nodes */}
              <div className="space-y-6 relative z-10">
                {initSteps.map((step, idx) => {
                  const isCurrent = step.status === 'loading';
                  const isDone = step.status === 'success';
                  const isWarning = step.status === 'warn';
                  const isFailed = step.status === 'error';
                  const isIdle = step.status === 'idle';

                  // Select Node Avatar Styling
                  let iconElement = <div className="w-2.5 h-2.5 rounded-full bg-stone-300"></div>;
                  let containerBg = 'bg-stone-50 border-stone-200 text-stone-400';
                  
                  if (isCurrent) {
                    iconElement = <Loader2 className="w-4 h-4 animate-spin text-amber-600" />;
                    containerBg = 'bg-amber-50 border-amber-300 text-amber-800 ring-2 ring-amber-100';
                  } else if (isDone) {
                    iconElement = <CheckCircle2 className="w-5 h-5 text-emerald-600" />;
                    containerBg = 'bg-emerald-50 border-emerald-300 text-emerald-800';
                  } else if (isWarning) {
                    iconElement = <AlertTriangle className="w-4 h-4 text-amber-600" />;
                    containerBg = 'bg-amber-50 border-amber-300 text-amber-900';
                  } else if (isFailed) {
                    iconElement = <XCircle className="w-5 h-5 text-rose-600" />;
                    containerBg = 'bg-rose-50 border-rose-300 text-rose-900 ring-2 ring-rose-100';
                  }

                  return (
                    <div key={step.id} className="flex gap-4 items-start">
                      {/* Node Circle */}
                      <div className={`w-11 h-11 rounded-full border flex items-center justify-center flex-shrink-0 transition-all ${containerBg}`}>
                        {iconElement}
                      </div>

                      {/* Content Panel */}
                      <div className="flex-1 bg-stone-50 hover:bg-stone-100/50 rounded-lg p-3 border border-stone-200/60 transition-colors">
                        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-1">
                          <h3 className="text-xs font-bold text-stone-900 flex items-center gap-2">
                            <span>{idx + 1}. {step.label}</span>
                            {isCurrent && (
                              <span className="text-[9px] bg-amber-100 text-amber-800 font-mono font-bold uppercase px-1.5 py-0.5 rounded animate-pulse">
                                active
                              </span>
                            )}
                          </h3>
                          <span className="text-[10px] font-mono text-stone-500">
                            {isDone && '✓ COMPLETED'}
                            {isCurrent && '● PROCESSING'}
                            {isWarning && '▲ WARNING'}
                            {isFailed && '✗ FAULT'}
                            {isIdle && '○ IDLE'}
                          </span>
                        </div>
                        <p className="text-[11px] text-stone-600 mt-1 font-serif">
                          {step.description}
                        </p>

                        {/* Extra Status Report / Value */}
                        {step.error && (
                          <div className={`mt-2 p-2 rounded text-[10px] font-mono border ${
                            isFailed ? 'bg-rose-100/50 border-rose-200 text-rose-900' : 'bg-amber-100/50 border-amber-200 text-amber-900'
                          }`}>
                            <div className="font-semibold uppercase tracking-wider mb-0.5">
                              {isFailed ? 'Exception Details:' : 'Diagnostics Warning:'}
                            </div>
                            <div className="break-all whitespace-pre-wrap">{step.error}</div>
                            
                            {/* Proactive troubleshooting suggestion based on step ID */}
                            <div className="mt-1.5 text-[11px] font-serif italic text-stone-700 flex items-start gap-1">
                              <span className="font-sans font-bold text-[#9A3412]">👉 Recommended Fix:</span>
                              <span>
                                {step.id === 'env-config' && 'Ensure the Cloud Run container backend was built correctly and DEFAULT_SPREADSHEET_ID is supplied. Ensure the /api/config proxy exists in server.ts.'}
                                {step.id === 'firebase-auth' && 'Verify that firebase-applet-config.json was provisioned correctly with Firebase keys. Confirm third-party cookies are enabled in your browser.'}
                                {step.id === 'oauth-detect' && 'Link your Google account by clicking "Bypass to Sandbox" and choosing "Link Google Sheet Workspace" or signing in on top-right.'}
                                {step.id === 'list-sheets' && 'Your secure OAuth token may contain expired claims. Click "Link Google Sheet Workspace" or bypass to refresh Google session privileges.'}
                                {step.id === 'sheet-metadata' && 'Verify that the designated Spreadsheet ID exists on your Google account or click Settings (after bypass) to replace with a valid Sheet GUID.'}
                              </span>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </section>

          {/* RIGHT: Live Diagnostic Console Logs (Span 5) */}
          <section className="lg:col-span-5 flex flex-col gap-4 bg-stone-900 rounded-xl p-5 border border-stone-850 shadow-inner h-[480px]">
            <div className="flex items-center justify-between border-b border-stone-800 pb-2.5">
              <h2 className="text-xs uppercase font-extrabold tracking-widest text-emerald-500 font-mono flex items-center gap-2">
                <Terminal className="w-4 h-4 text-emerald-500 animate-pulse" />
                <span>DIAGNOSTIC TELEMETRY LOGS</span>
              </h2>
              <span className="text-[9px] font-mono text-stone-400 bg-stone-800 px-2 py-0.5 rounded">
                LIVE TERMINAL
              </span>
            </div>

            {/* Terminal Body */}
            <div className="flex-1 overflow-y-auto font-mono text-[10px] text-stone-300 space-y-2 pr-1 scrollbar-thin scrollbar-thumb-stone-800 scrollbar-track-transparent">
              {diagnosticsLogs.length === 0 ? (
                <div className="text-stone-500 italic text-center h-full flex flex-col justify-center items-center gap-2">
                  <Clock className="w-5 h-5 text-stone-600 animate-spin" />
                  <span>Awaiting diagnostic pipeline ticks...</span>
                </div>
              ) : (
                diagnosticsLogs.map((log, i) => {
                  let badgeColor = 'text-emerald-400';
                  if (log.type === 'warn') badgeColor = 'text-amber-400 bg-amber-950/40 px-1 py-0.5 rounded';
                  if (log.type === 'error') badgeColor = 'text-rose-400 bg-rose-950/40 px-1 py-0.5 rounded font-extrabold';
                  
                  return (
                    <div key={i} className="leading-normal hover:bg-stone-800/45 p-1 rounded transition-colors break-words">
                      <span className="text-stone-500 mr-2">[{log.timestamp}]</span>
                      <span className={`font-bold mr-1.5 ${badgeColor}`}>{log.type.toUpperCase()}:</span>
                      <span>{log.message}</span>
                    </div>
                  );
                })
              )}
            </div>

            {/* Quick tips bar */}
            <div className="border-t border-stone-800 pt-2.5 text-[9.5px] text-stone-400 font-mono leading-relaxed bg-stone-950/20 p-2 rounded border border-stone-800/40">
              <span className="text-[#F97316] font-bold">INFO:</span> Built-in security observers automatically check token health. Use the pipeline checklist to troubleshoot if the workspace remains locked.
            </div>
          </section>

        </main>

        {/* Diagnostic Footer */}
        <footer className="border-t border-stone-200 bg-white py-4 px-6 text-center text-stone-400 font-serif text-[11px] italic">
          Daily Hierarchical News Reader • Pipeline Transparency Diagnostic Terminal Console
        </footer>
      </div>
      </>
    );
  };

  return (
    <div className={(!isMindMapVisible && (currentUser || isSandboxMode || selectedSheetId)) ? "h-screen w-screen overflow-hidden relative bg-[#FDFCFB] dark:bg-stone-900 text-[#1A1A1A] dark:text-stone-100 font-sans antialiased flex flex-col justify-center items-center transition-colors" : "min-h-screen w-full relative bg-[#FDFCFB] dark:bg-stone-900 text-[#1A1A1A] dark:text-stone-100 font-sans antialiased flex flex-col justify-center items-center overflow-x-hidden transition-colors"}>
      {/* Floating Top-Right Action Bar (Shortcut to Fullscreen Mindmap & Settings) */}
      <div className="fixed top-4 right-4 z-[90] flex items-center gap-1 bg-white/95 dark:bg-stone-900/95 shadow-md border border-stone-250 dark:border-stone-800 h-10 px-2 rounded-full backdrop-blur-md transition-all">
        <button
          onClick={() => setIsVerticalFullscreenOpen(true)}
          className="h-7 w-7 rounded-full text-stone-600 hover:text-red-700 dark:text-stone-400 dark:hover:text-red-500 hover:bg-stone-100 dark:hover:bg-stone-800 transition-colors flex items-center justify-center cursor-pointer"
          title="Directly Open Fullscreen Mindmap"
        >
          <Layers className="w-4 h-4 text-red-750 dark:text-red-550" />
        </button>

        <div className="w-[1px] h-4 bg-stone-200 dark:bg-stone-800 mx-0.5" />

        <button
          onClick={() => setIsSettingsOpen(true)}
          className="h-7 w-7 rounded-full text-stone-600 hover:text-stone-900 dark:text-stone-400 dark:hover:text-white hover:bg-stone-100 dark:hover:bg-stone-800 transition-colors flex items-center justify-center cursor-pointer"
          title="Settings"
        >
          <Settings className="w-4 h-4 animate-spin-hover" />
        </button>
      </div>

      {/* Floating User Account / Profile Menu in top-left */}
      <div className="fixed top-4 left-4 z-[95]">
        <button
          onClick={() => setIsProfileOpen(!isProfileOpen)}
          className="h-10 w-10 rounded-full border border-stone-250 bg-white shadow-md hover:shadow-lg transition-all flex items-center justify-center overflow-hidden hover:scale-105 active:scale-95 cursor-pointer focus:outline-none"
          title="User Accounts & Help Guide"
        >
          {currentUser?.photoURL ? (
            <img
              src={currentUser.photoURL}
              alt={currentUser.displayName || 'User'}
              className="w-full h-full object-cover"
              referrerPolicy="no-referrer"
            />
          ) : (
            <div className={`w-full h-full flex items-center justify-center font-bold text-sm ${isActuallyAdmin ? 'bg-amber-100 text-amber-800' : 'bg-stone-100 text-stone-700'}`}>
              {currentUser?.displayName ? (
                currentUser.displayName.charAt(0).toUpperCase()
              ) : currentUser?.email ? (
                currentUser.email.charAt(0).toUpperCase()
              ) : (
                <User className="w-5 h-5 text-stone-500" />
              )}
            </div>
          )}
        </button>

        <AnimatePresence>
          {isProfileOpen && (
            <>
              {/* Backdrop tag to detect clicks outside */}
              <div 
                className="fixed inset-0 z-[-1] cursor-default" 
                onClick={() => setIsProfileOpen(false)} 
              />
              <motion.div
                initial={{ opacity: 0, y: 10, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 10, scale: 0.95 }}
                transition={{ duration: 0.15 }}
                className="absolute top-12 left-0 w-80 bg-[#FCFAF7] border border-stone-300 shadow-2xl rounded-2xl p-5 text-stone-900 font-sans text-left z-50 focus:outline-none"
              >
                {/* Header info */}
                <div className="flex items-start gap-3 pb-4 border-b border-stone-200">
                  <div className="h-11 w-11 rounded-full border border-stone-200 overflow-hidden shrink-0 flex items-center justify-center bg-white">
                    {currentUser?.photoURL ? (
                      <img
                        src={currentUser.photoURL}
                        alt="Profile"
                        className="w-full h-full object-cover"
                        referrerPolicy="no-referrer"
                      />
                    ) : (
                      <User className="w-5 h-5 text-stone-400" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <h4 className="text-xs font-black text-stone-900 truncate tracking-tight uppercase">
                      {currentUser?.displayName || (currentUser ? 'Authenticated User' : 'Guest Account')}
                    </h4>
                    <p className="text-[10px] text-stone-500 truncate font-mono">
                      {currentUser?.email || 'Standalone Sandbox Mode'}
                    </p>
                    <div className="mt-1.5 flex items-center gap-1.5">
                      {isActuallyAdmin ? (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-amber-100 text-amber-800 border border-amber-250 text-[9px] font-mono font-extrabold uppercase tracking-tight">
                          <Shield className="w-3 h-3 text-amber-750" /> Administrator
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-stone-150 text-stone-600 border border-stone-200 text-[9px] font-mono font-extrabold uppercase tracking-tight">
                          <BookOpen className="w-3 h-3 text-stone-400" /> Reader Mode
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                {/* Switcher & Guide Actions */}
                <div className="py-4 space-y-3 border-b border-stone-200">
                  <span className="text-[9px] font-mono font-bold text-stone-450 uppercase tracking-wider block">
                    Developer Test Profiles & Switchers
                  </span>
                  
                  <div className="flex flex-col gap-2">
                    <button
                      onClick={handleSwitchToTestAdmin}
                      className="w-full text-left px-3 py-2 text-xs text-amber-900 hover:text-amber-950 bg-amber-50 hover:bg-amber-100/75 border border-amber-200 rounded-lg font-bold font-sans transition-colors flex items-center justify-between group cursor-pointer"
                    >
                      <span className="flex items-center gap-2">
                        <Shield className="w-3.5 h-3.5 text-amber-600" />
                        Login as Admin (Full Control)
                      </span>
                      <span className="font-mono text-[9px] text-amber-600 group-hover:translate-x-0.5 transition-all">→</span>
                    </button>

                    <button
                      onClick={handleSwitchToTestReader}
                      className="w-full text-left px-3 py-2 text-xs text-stone-750 hover:text-stone-900 bg-stone-100 hover:bg-stone-150 border border-stone-200 rounded-lg font-bold font-sans transition-colors flex items-center justify-between group cursor-pointer"
                    >
                      <span className="flex items-center gap-2">
                        <User className="w-3.5 h-3.5 text-stone-500" />
                        Login as Test Normal Reader
                      </span>
                      <span className="font-mono text-[9px] text-stone-500 group-hover:translate-x-0.5 transition-all">→</span>
                    </button>

                    <div className="flex items-center justify-between pt-1">
                      <span className="text-[10px] text-stone-600 font-bold uppercase tracking-wider font-mono">Simulate Admin Mode:</span>
                      <input
                        type="checkbox"
                        checked={isAdminMode}
                        onChange={(e) => {
                          setIsAdminMode(e.target.checked);
                          addToast(
                            e.target.checked ? 'Admin Privileges Simulation On' : 'Admin Simulation Off',
                            e.target.checked ? 'Simulating administrative layout and tools.' : 'Switched back to standard news deck stream.',
                            'info'
                          );
                        }}
                        className="rounded border-stone-300 text-amber-700 focus:ring-amber-500 h-4 w-4 cursor-pointer"
                      />
                    </div>
                  </div>
                </div>

                <div className="pt-3 space-y-2">
                  <button
                    onClick={() => {
                      setIsProfileOpen(false);
                      setIsHelpOpen(true);
                    }}
                    className="w-full text-left px-3 py-2 text-xs text-stone-700 hover:text-stone-950 hover:bg-stone-100 rounded-lg transition-colors flex items-center gap-2 font-bold uppercase tracking-wider cursor-pointer"
                  >
                    <HelpCircle className="w-4 h-4 text-stone-500" />
                    <span>Quick-Start Help Guide</span>
                  </button>

                  {currentUser ? (
                    <button
                      onClick={() => {
                        handleSignOut();
                        setIsProfileOpen(false);
                      }}
                      className="w-full text-left px-3 py-2 text-xs text-red-700 hover:text-red-900 hover:bg-red-50 rounded-lg transition-colors flex items-center gap-2 font-bold uppercase tracking-wider cursor-pointer"
                    >
                      <LogOut className="w-4 h-4 text-red-650" />
                      <span>Log Out Session</span>
                    </button>
                  ) : (
                    <button
                      onClick={() => {
                        handleSignIn();
                        setIsProfileOpen(false);
                      }}
                      className="w-full text-left px-3 py-2 text-xs text-emerald-850 hover:text-emerald-950 hover:bg-emerald-50 rounded-lg transition-colors flex items-center gap-2 font-bold uppercase tracking-wider cursor-pointer"
                    >
                      <LogIn className="w-4 h-4 text-emerald-600" />
                      <span>Log In (OAuth Google Drive)</span>
                    </button>
                  )}
                </div>
              </motion.div>
            </>
          )}
        </AnimatePresence>
      </div>

      {/* Main App Layout */}
      <main className={(!isMindMapVisible && (currentUser || isSandboxMode || selectedSheetId)) ? "w-full h-full flex flex-col justify-center items-stretch relative overflow-hidden" : "w-full max-w-4xl px-4 flex-1 flex flex-col justify-center items-center min-h-screen py-10"}>
        {/* Onboarding View: If not logged-in, not sandbox, and no default sheet id exists, present premium cover setup */}
        {isAdminMode && !currentUser && !isSandboxMode && !selectedSheetId ? (
          <div className="max-w-3xl mx-auto w-full py-12 flex flex-col items-center text-center">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="space-y-6"
            >
              <div className="inline-flex items-center gap-2 px-3.5 py-1 bg-red-50 text-red-700 rounded border border-red-200/60 text-[9px] font-extrabold uppercase tracking-widest">
                <Sparkles className="w-3.5 h-3.5 animate-pulse" /> Unified Daily News Mindmaps
              </div>
              
              <h2 className="text-4xl sm:text-5xl font-serif font-black text-stone-950 tracking-tight leading-[1.1] max-w-2xl mx-auto">
                Explore Global News Hierarchies with Fluid Gestures
              </h2>

              <p className="text-[17px] leading-relaxed font-serif text-stone-700 mb-6 italic border-l-4 border-red-700 pl-6 max-w-xl mx-auto text-left py-1">
                Unlock an interactive micro-news deck organized in parent-child relations. Navigate siblings upward or downward. Swim sideways to dive from global affairs into local stock impacts.
              </p>

              {/* Action buttons */}
              <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-4">
                <button
                  onClick={handleSignIn}
                  className="w-full xl:w-auto px-6 py-3.5 rounded bg-red-700 hover:bg-red-800 text-white font-extrabold uppercase tracking-wider text-xs transition-all shadow-md cursor-pointer flex items-center justify-center gap-2 border border-red-900"
                >
                  <FileSpreadsheet className="w-4 h-4" /> Link Google Sheet Workspace
                </button>
              </div>

              {/* visual breakdown grid */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 pt-12 text-left max-w-3xl mx-auto">
                <div className="bg-[#FAF9F5] border border-stone-250 p-5 rounded">
                  <div className="text-[9px] font-mono text-red-700 font-extrabold mb-1">GESTURE DRIVEN</div>
                  <h4 className="text-sm font-bold font-serif text-stone-900 mb-1.5">Orthogonal Swiping</h4>
                  <p className="text-xs text-stone-600 leading-relaxed font-serif">Scroll vertically to flip stories in-category. Drill horizontally to plunge deeper into precise niches.</p>
                </div>
                <div className="bg-[#FAF9F5] border border-stone-250 p-5 rounded">
                  <div className="text-[9px] font-mono text-stone-700 font-extrabold mb-1">MIND MAP</div>
                  <h4 className="text-sm font-bold font-serif text-stone-900 mb-1.5">Interactive Graph Cards</h4>
                  <p className="text-xs text-stone-600 leading-relaxed font-serif">A stunning dual-pane node chart visualizes entire hierarchies from macro events down to stock tickets.</p>
                </div>
                <div className="bg-[#FAF9F5] border border-stone-250 p-5 rounded">
                  <div className="text-[9px] font-mono text-stone-700 font-extrabold mb-1">SHEET DRIVEN</div>
                  <h4 className="text-sm font-bold font-serif text-stone-900 mb-1.5">Zero-Database Grid</h4>
                  <p className="text-xs text-stone-600 leading-relaxed font-serif">Sync data inside tabs. Easily add custom stories directly inside Google Sheets.</p>
                </div>
              </div>
            </motion.div>
          </div>
        ) : isAdminMode && currentUser && !isSandboxMode && !selectedSheetId ? (
          <div className="max-w-xl mx-auto w-full py-16">
            <motion.div
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-[#FCFAF7] border border-stone-300 rounded-2xl p-8 shadow-xl text-center space-y-6"
            >
              <div className="inline-flex items-center gap-2 px-3.5 py-1 bg-amber-50 text-amber-800 rounded border border-amber-200 text-[10px] font-mono uppercase tracking-wider mx-auto">
                <FileSpreadsheet className="w-3.5 h-3.5 text-amber-700 shrink-0" />
                Google Drive Connected
              </div>

              <div className="space-y-2">
                <h3 className="text-2xl font-serif font-black text-stone-900 tracking-tight">
                  Initialize Your News Database
                </h3>
                <p className="text-xs text-stone-600 font-serif italic max-w-md mx-auto">
                  You are signed in as <span className="font-sans font-bold text-stone-900 not-italic">{currentUser.displayName || currentUser.email}</span>, but your Google Drive does not have a database spreadsheet for this dashboard yet.
                </p>
              </div>

              <div className="space-y-3 bg-[#FCFAF7] p-4.5 rounded-xl border border-stone-200 text-left">
                <span className="text-[9px] font-mono font-bold text-stone-550 uppercase tracking-widest block">Automated First-Time Setup</span>
                <p className="text-[12px] text-stone-600 leading-relaxed font-serif">
                  Click below to automatically create a structured spreadsheet named <strong className="font-sans text-[11px] bg-stone-100 px-1.5 py-0.5 rounded text-stone-900 border border-stone-200">Hierarchy News Daily Log</strong> inside your Google Drive. We will automatically pre-populate it with starting sample categories, global-to-stock news feeds, and hierarchies for you.
                </p>
              </div>

              {errorStatus && (
                <div className="text-xs text-red-700 bg-red-50 p-3 rounded-lg border border-red-200 flex items-center gap-2 text-left font-sans">
                  <Info className="w-4 h-4 shrink-0" />
                  <span>{errorStatus}</span>
                </div>
              )}

              <div className="pt-2 flex flex-col sm:flex-row gap-3">
                <button
                  onClick={handleCreateNewSheet}
                  disabled={loadingSheets}
                  className="w-full px-5 py-3.5 bg-red-700 hover:bg-red-800 text-white text-xs font-bold uppercase tracking-wider rounded-lg border border-red-900 transition-all cursor-pointer flex items-center justify-center gap-2 disabled:opacity-50 font-sans"
                >
                  {loadingSheets ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>Creating Spreadsheet...</span>
                    </>
                  ) : (
                    <>
                      <Plus className="w-4 h-4" />
                      <span>Initialize Sheets Database</span>
                    </>
                  )}
                </button>
              </div>

              <p className="text-[10px] text-stone-500 font-serif">
                You can also link any existing spreadsheets directly inside Settings or evaluate simulated profiles in the switcher console.
              </p>
            </motion.div>
          </div>
        ) : !isMindMapVisible ? (
          /* FULL VIEWPORT TOUCHING ALL 4 CORNERS (with absolutely zero margins, headers, or scrolling on overall page) */
          <div className="w-full h-full flex flex-col items-stretch justify-stretch relative">
            {isSyncing ? (
              <div className="flex flex-col items-center justify-center text-stone-500 h-full w-full font-serif italic bg-[#FDFCFB]">
                <Loader2 className="w-8 h-8 animate-spin text-red-700 mb-2" />
                <p className="text-xs">Synchronizing node pathways...</p>
              </div>
            ) : activeItem ? (
              <AnimatePresence mode="wait">
                <motion.div
                  key={activeItem.id}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.15 }}
                  className="w-full h-full"
                >
                  <NewsCard
                    item={activeItem}
                    breadcrumbs={breadcrumbs}
                    onSwipeUp={handleScrollUp}
                    onSwipeDown={handleScrollDown}
                    onSwipeLeft={handleGoAbove}
                    onSwipeRight={handleGoDeeper}
                    hasNextSibling={activeLevelIndex !== -1 && activeLevelIndex < levelNodes.length - 1}
                    hasPrevSibling={activeLevelIndex > 0}
                    hasChildren={hasDeeperLevel}
                    hasParent={hasAboveLevel}
                    keyboardGuide={true}
                    progressPercent={progressPercent}
                    isFullScreen={true}
                  />
                </motion.div>
              </AnimatePresence>
            ) : (
              <div className="text-center h-full w-full flex flex-col items-center justify-center text-stone-600 bg-[#FCFAF7] p-8">
                <div className="p-3 bg-red-50 dark:bg-red-950/30 rounded-full mb-4 text-red-700 dark:text-red-400">
                  <Sparkles className="w-6 h-6 animate-pulse" />
                </div>
                <p className="text-base font-black font-sans mb-1.5 text-stone-900 dark:text-stone-100 uppercase tracking-tight">No News Stories in Active Slot</p>
                <p className="text-xs text-stone-605 dark:text-stone-400 max-w-sm mx-auto font-serif italic mb-5 leading-relaxed text-center">
                  This specific date timeline currently contains no hierarchical news data. Deploy real-time global news summaries now using our AI-driven Google Search Grounding engine!
                </p>

                {errorStatus && (
                  <div className="bg-red-50 dark:bg-red-950/20 text-red-955 dark:text-red-300 border border-red-200 dark:border-red-900 p-3 rounded-xl text-xs font-semibold max-w-sm mx-auto mb-4 text-left flex items-start gap-2">
                    <Info className="w-4 h-4 text-red-750 dark:text-red-400 shrink-0 mt-0.5" />
                    <span>{errorStatus}</span>
                  </div>
                )}

                <div className="text-[10px] font-mono text-stone-550 dark:text-stone-450 mb-5 bg-stone-50 dark:bg-stone-900/60 px-3 py-1.5 rounded-lg border border-stone-200 dark:border-stone-800 text-center">
                  Mode: <span className="font-extrabold uppercase text-stone-750 dark:text-stone-350">{isSandboxMode ? 'Sandbox Simulator' : 'Live Sheets DB'}</span> | Target Date: <span className="font-extrabold text-red-755 dark:text-red-400">{isSandboxMode ? sandboxActiveDate : selectedDate}</span>
                </div>

                <div className="flex flex-col sm:flex-row gap-3 w-full justify-center max-w-md">
                  <button
                    onClick={handleGenerateLiveNews}
                    disabled={isAiLoading || (!isSandboxMode && (!selectedSheetId || !selectedDate))}
                    className="px-5 py-2.5 bg-red-700 hover:bg-red-800 disabled:bg-stone-100 disabled:text-stone-450 dark:disabled:bg-stone-850 dark:disabled:text-stone-600 text-white text-[11.5px] font-black uppercase tracking-wider rounded-xl cursor-pointer border border-red-850 transition-all shadow-sm active:scale-95 flex items-center justify-center gap-2"
                  >
                    {isAiLoading ? (
                      <Loader2 className="w-3.5 h-3.5 animate-spin text-white" />
                    ) : (
                      <Sparkles className="w-3.5 h-3.5 text-white" />
                    )}
                    <span>Harvest AI News</span>
                  </button>

                  <button
                    onClick={handleBulkSeedPastWeek}
                    className="px-5 py-2.5 bg-white dark:bg-stone-900 hover:bg-stone-55 dark:hover:bg-stone-800 text-stone-800 dark:text-stone-200 text-[11.5px] font-bold uppercase tracking-wider rounded-xl border border-stone-300 dark:border-stone-750 cursor-pointer transition-all shadow-3xs active:scale-95"
                    title="Generate a pre-populated timeline of 500+ cards for local sandbox simulation"
                  >
                    Seed Sandbox Timeline
                  </button>
                </div>
              </div>
            )}
          </div>
        ) : (
          <div className="space-y-6 w-full max-w-7xl px-4 sm:px-6 lg:px-8 py-6 h-full overflow-y-auto">
            {/* Display general status notifications */}
            {errorStatus && (
              <div className="bg-red-50 text-red-955 border border-red-200 p-4 rounded-xl text-xs font-semibold max-w-xl mx-auto flex items-center gap-2">
                <Info className="w-4.5 h-4.5 text-red-700" />
                <span>Error: {errorStatus}</span>
              </div>
            )}

            {apiNotice && (
              <div className="bg-amber-50 text-stone-900 border border-amber-250 p-4 rounded-xl text-xs font-serif italic max-w-xl mx-auto flex items-center gap-3">
                <Sparkles className="w-5 h-5 text-amber-600 animate-pulse shrink-0" />
                <div className="text-left">
                  <span className="font-sans not-italic font-extrabold uppercase tracking-wider text-[10px] text-amber-800 block mb-0.5">Notification</span>
                  <span>{apiNotice}</span>
                </div>
              </div>
            )}

            {/* Main Interactive Workspace splitting Layout */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-stretch min-h-[620px]">
              
              {/* Left Column: Classic Gesture-based Inshorts News Deck */}
              <div className={isMindMapVisible ? "lg:col-span-5 w-full flex flex-col justify-start" : "lg:col-span-12 max-w-4xl mx-auto w-full flex flex-col justify-start"}>
                {/* 📅 Dynamic Temporal Horizon Controller (Date Tabs) */}
                <div className="bg-white/95 dark:bg-stone-900/95 border border-stone-250 dark:border-stone-800 p-3 rounded-2xl shadow-sm mb-5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 backdrop-blur-md">
                  <div className="flex items-center gap-2 overflow-x-auto scrollbar-none py-1 flex-1">
                    <span className="text-[9px] font-mono font-black uppercase tracking-widest text-stone-500 shrink-0 select-none flex items-center gap-1">
                      📅 Date Tabs:
                    </span>
                    <div className="flex items-center gap-1.5 overflow-x-auto scrollbar-none">
                      {(isSandboxMode ? sandboxDates : (sheetInfo?.tabs || [selectedDate || todayDateStr])).map((tabDate) => {
                        const isActive = isSandboxMode ? (sandboxActiveDate === tabDate) : (selectedDate === tabDate);
                        return (
                          <button
                            key={tabDate}
                            onClick={() => {
                              if (isSandboxMode) {
                                setSandboxActiveDate(tabDate);
                              } else {
                                setSelectedDate(tabDate);
                              }
                              addToast('Date Switched', `Focused news feed on date: ${tabDate}`, 'success');
                            }}
                            className={`px-3 py-1.5 rounded-full text-[10.5px] font-bold font-mono tracking-tight transition-all shrink-0 cursor-pointer border ${
                              isActive
                                ? 'bg-red-700 text-white border-red-800 shadow-sm scale-105'
                                : 'bg-stone-50 dark:bg-stone-850 hover:bg-stone-100 dark:hover:bg-stone-800 text-stone-650 dark:text-stone-350 border-stone-200 dark:border-stone-800'
                            }`}
                          >
                            {tabDate}
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  <div className="flex items-center gap-2 shrink-0 self-end sm:self-center">
                    {/* Harvest Live AI News Button directly visible on main screen */}
                    <button
                      onClick={handleGenerateLiveNews}
                      disabled={isAiLoading || (!isSandboxMode && (!selectedSheetId || !selectedDate))}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-rose-700 hover:bg-rose-800 disabled:bg-stone-100 dark:disabled:bg-stone-850 disabled:text-stone-400 dark:disabled:text-stone-600 text-white text-[9px] font-black uppercase tracking-wider rounded-full border border-rose-800 cursor-pointer shadow-2xs transition-all active:scale-95 shrink-0"
                      title="Harvest real-time web headlines via Gemini 3.5 Flash Google Search grounding"
                    >
                      {isAiLoading ? (
                        <Loader2 className="w-3 h-3 animate-spin text-white" />
                      ) : (
                        <Sparkles className="w-3 h-3 text-white animate-pulse" />
                      )}
                      <span>Harvest Live</span>
                    </button>

                    {/* View Mindmap Switch Toggle button directly on layout */}
                    <button
                      onClick={() => setIsMindMapVisible(!isMindMapVisible)}
                      className={`inline-flex items-center gap-1 px-3 py-1.5 rounded-full text-[9px] font-black uppercase tracking-wider transition-colors border cursor-pointer ${
                        isMindMapVisible
                          ? 'bg-red-50 dark:bg-red-950/40 text-red-750 dark:text-red-400 border-red-200 dark:border-red-900/60'
                          : 'bg-stone-50 hover:bg-stone-100 dark:bg-stone-850 dark:hover:bg-stone-800 text-stone-700 dark:text-stone-300 border-stone-250 dark:border-stone-800'
                      }`}
                      title="Toggle dual-pane horizontal Node Mindmap visualization"
                    >
                      <GitFork className="w-3 h-3 shrink-0" />
                      <span>{isMindMapVisible ? 'Hide Map' : 'Show Map'}</span>
                    </button>
                  </div>
                </div>

                <div className="flex flex-col sm:flex-row items-center justify-between gap-2 mb-4 px-1.5">
                  <div className="text-center sm:text-left">
                    <span className="text-[10px] font-mono font-bold text-stone-500 uppercase tracking-widest block mb-0.5">
                      Editorial News Deck
                    </span>
                    <p className="text-[11px] text-stone-600 font-serif italic">
                      Scroll up/down for siblings & vertical depth
                    </p>
                  </div>
                </div>

                <div className="flex-1 min-h-[740px] md:min-h-[820px] w-full flex items-center justify-center relative">
                  {isSyncing ? (
                    <div className="flex flex-col items-center text-stone-500 py-24 font-serif italic">
                      <Loader2 className="w-8 h-8 animate-spin text-red-700 mb-2" />
                      <p className="text-xs">Synchronizing node pathways...</p>
                    </div>
                  ) : activeItem ? (
                    <AnimatePresence mode="wait">
                      <motion.div
                        key={activeItem.id}
                        initial={{ opacity: 0, y: 15 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -15 }}
                        transition={{ duration: 0.22 }}
                        className="w-full"
                      >
                        <NewsCard
                          item={activeItem}
                          breadcrumbs={breadcrumbs}
                          onSwipeUp={handleScrollUp}
                          onSwipeDown={handleScrollDown}
                          onSwipeLeft={handleGoAbove}
                          onSwipeRight={handleGoDeeper}
                          hasNextSibling={activeLevelIndex !== -1 && activeLevelIndex < levelNodes.length - 1}
                          hasPrevSibling={activeLevelIndex > 0}
                          hasChildren={hasDeeperLevel}
                          hasParent={hasAboveLevel}
                          keyboardGuide={true}
                          progressPercent={progressPercent}
                        />
                      </motion.div>
                    </AnimatePresence>
                  ) : (
                    <div className="text-center text-stone-600 border border-dashed border-stone-350 dark:border-stone-800 p-8 rounded-2xl w-full max-w-lg my-auto min-h-[420px] flex flex-col items-center justify-center bg-white/50 dark:bg-stone-950/40 backdrop-blur-md">
                      <div className="p-3 bg-red-50 dark:bg-red-950/30 rounded-full mb-4 text-red-700 dark:text-red-400">
                        <Sparkles className="w-6 h-6 animate-pulse" />
                      </div>
                      <p className="text-base font-black font-sans mb-1.5 text-stone-900 dark:text-stone-100 uppercase tracking-tight">No News Stories in Active Slot</p>
                      <p className="text-xs text-stone-605 dark:text-stone-400 max-w-sm mx-auto font-serif italic mb-5 leading-relaxed text-center">
                        This specific date timeline currently contains no hierarchical news data. Deploy real-time global news summaries now using our AI-driven Google Search Grounding engine!
                      </p>

                      {errorStatus && (
                        <div className="bg-red-50 dark:bg-red-950/20 text-red-950 dark:text-red-300 border border-red-200 dark:border-red-900 p-3 rounded-xl text-xs font-semibold max-w-sm mx-auto mb-4 text-left flex items-start gap-2">
                          <Info className="w-4 h-4 text-red-750 dark:text-red-400 shrink-0 mt-0.5" />
                          <span>{errorStatus}</span>
                        </div>
                      )}

                      <div className="text-[10px] font-mono text-stone-500 dark:text-stone-450 mb-5 bg-stone-50 dark:bg-stone-900/60 px-3 py-1.5 rounded-lg border border-stone-200 dark:border-stone-800 text-center">
                        Mode: <span className="font-extrabold uppercase text-stone-750 dark:text-stone-300">{isSandboxMode ? 'Sandbox Simulator' : 'Live Sheets DB'}</span> | Target Date: <span className="font-extrabold text-red-755 dark:text-red-400">{isSandboxMode ? sandboxActiveDate : selectedDate}</span>
                      </div>

                      <div className="flex flex-col sm:flex-row gap-3 w-full justify-center max-w-md">
                        <button
                          onClick={handleGenerateLiveNews}
                          disabled={isAiLoading || (!isSandboxMode && (!selectedSheetId || !selectedDate))}
                          className="px-5 py-2.5 bg-red-700 hover:bg-red-800 disabled:bg-stone-100 disabled:text-stone-400 dark:disabled:bg-stone-850 dark:disabled:text-stone-600 text-white text-[11px] font-black uppercase tracking-wider rounded-xl cursor-pointer border border-red-800 transition-all shadow-sm active:scale-95 flex items-center justify-center gap-2"
                        >
                          {isAiLoading ? (
                            <Loader2 className="w-3.5 h-3.5 animate-spin text-white" />
                          ) : (
                            <Sparkles className="w-3.5 h-3.5 text-white animate-pulse" />
                          )}
                          <span>Harvest AI News</span>
                        </button>

                        <button
                          onClick={handleBulkSeedPastWeek}
                          className="px-5 py-2.5 bg-white dark:bg-stone-900 hover:bg-stone-55 dark:hover:bg-stone-800 text-stone-800 dark:text-stone-200 text-[11px] font-bold uppercase tracking-wider rounded-xl border border-stone-300 dark:border-stone-700 cursor-pointer transition-all shadow-3xs active:scale-95"
                          title="Generate a pre-populated timeline of 500+ cards for local sandbox simulation"
                        >
                          Seed Sandbox Timeline
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Right Column (Span 7): Interactive Mind Map Tree & Live Seed Administration */}
              {isMindMapVisible && (
                <div className="lg:col-span-7 flex flex-col gap-6">
                  <div className="flex-1 h-[450px] lg:h-auto min-h-[460px]">
                    <MindMap
                      newsItems={newsItems}
                      activeNewsId={activeNewsId}
                      onSelectNode={(nodeId) => setActiveNewsId(nodeId)}
                    />
                  </div>
                </div>
              )}

            </div>

          </div>
        )}
      </main>

      {/* Settings Modal (Overlay) */}
      <AnimatePresence>
        {isSettingsOpen && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-stone-900/70 backdrop-blur-sm overflow-y-auto">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-[#FCFAF7] dark:bg-stone-900 border border-stone-300 dark:border-stone-800 rounded-2xl p-6 shadow-2xl w-full text-stone-900 dark:text-stone-100 relative font-sans my-8 transition-all max-w-4xl text-left"
            >
              {/* Close Button */}
              <button
                onClick={() => setIsSettingsOpen(false)}
                className="absolute top-4 right-4 p-1.5 rounded-lg border border-stone-200 dark:border-stone-700 text-stone-500 hover:text-stone-900 hover:bg-stone-100 dark:hover:bg-stone-800 transition-all cursor-pointer bg-white dark:bg-stone-900"
                title="Close settings"
              >
                <X className="w-4 h-4" />
              </button>

              {/* Title Section */}
              <div className="flex items-center gap-2.5 mb-5 pb-3 border-b border-stone-200 dark:border-stone-800">
                <Settings className="w-5 h-5 text-red-700 dark:text-red-500" />
                <div>
                  <h3 className="text-xs uppercase font-extrabold tracking-widest text-stone-900 dark:text-stone-100">Application Workspace & Preferences</h3>
                  <p className="text-[10px] text-stone-600 dark:text-stone-400 font-mono">Fine-tune dynamic temporal horizons & database triggers</p>
                </div>
              </div>

              {/* Preferences Settings (Visible to All Users) */}
              <div className="space-y-4">
                
                {/* 📂 Shared Google Sheet Link & Download Access */}
                <div className="bg-white dark:bg-stone-950 border border-stone-200 dark:border-stone-800 p-5 rounded-2xl shadow-xs space-y-4">
                  <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 border-b border-stone-100 dark:border-stone-900 pb-3">
                    <div className="text-left">
                      <span className="text-[10px] font-mono font-extrabold text-stone-500 dark:text-stone-400 uppercase tracking-widest block">
                        Master Spreadsheet Database Connection
                      </span>
                      <p className="text-[11.5px] text-stone-600 dark:text-stone-300 font-serif italic mt-0.5">
                        Verify your active real-time data source connection and view the direct database sheet.
                      </p>
                    </div>

                    <div className="flex items-center gap-1.5 self-start md:self-center">
                      <span className={`w-2 h-2 rounded-full ${isSandboxMode ? 'bg-amber-500 animate-pulse' : 'bg-emerald-500 animate-pulse'}`} />
                      <span className="text-[9px] font-mono font-bold text-stone-500 dark:text-stone-400 bg-stone-100 dark:bg-stone-900 py-0.5 px-2 rounded-md truncate max-w-[150px]" title={selectedSheetId || 'Default Master DB'}>
                        ID: {(selectedSheetId || 'e/2PACX-1vS...2K0t6').substring(0, 16)}...
                      </span>
                    </div>
                  </div>

                  {/* 📊 Source Verification Card */}
                  <div className="p-4 rounded-xl border bg-stone-50/50 dark:bg-stone-900/30 border-stone-200 dark:border-stone-800 space-y-3">
                    <div className="flex flex-wrap items-center gap-2 justify-between">
                      <span className="text-[11px] font-bold text-stone-700 dark:text-stone-300">
                        Is active data source a Google Sheet?
                      </span>
                      {isSandboxMode ? (
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 text-[10px] font-extrabold uppercase rounded-full bg-amber-100 text-amber-800 border border-amber-200 dark:bg-amber-950/40 dark:text-amber-400 dark:border-amber-900">
                          🟡 No (Sandbox Simulation Mode Active)
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 text-[10px] font-extrabold uppercase rounded-full bg-emerald-100 text-emerald-800 border border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-400 dark:border-emerald-900">
                          🟢 Yes (Live Google Sheets Database)
                        </span>
                      )}
                    </div>

                    <p className="text-[11px] text-stone-600 dark:text-stone-400 leading-relaxed">
                      {isSandboxMode ? (
                        "The application is currently running in isolated Sandbox Simulation. Updates are stored temporary in program variables. Switch off Sandbox mode or log in to read and write directly to live Google Sheets."
                      ) : (
                        "All read and write operations are synchronized live with the Google Sheet database. Live AI harvests will overwrite target tabs directly on the connected sheet."
                      )}
                    </p>

                    <div className="pt-2 border-t border-stone-200/60 dark:border-stone-800/60 space-y-2">
                      <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-stone-500 dark:text-stone-400 block">
                        Workable Source Sheet Link:
                      </span>
                      <div className="flex flex-col sm:flex-row gap-2 items-stretch sm:items-center justify-between p-2.5 bg-stone-100 dark:bg-stone-950 rounded-lg border border-stone-200 dark:border-stone-850 font-mono text-[10.5px]">
                        <a 
                          href={spreadsheetUrls.viewUrl} 
                          target="_blank" 
                          rel="noopener noreferrer"
                          className="text-blue-600 dark:text-blue-400 hover:underline break-all truncate max-w-full sm:max-w-[480px] font-medium"
                          title="Click to open the connected Google Sheet in a new browser tab"
                        >
                          {spreadsheetUrls.viewUrl}
                        </a>
                        <button
                          onClick={() => {
                            navigator.clipboard.writeText(spreadsheetUrls.viewUrl);
                            addToast('Link Copied', 'Active Google Sheet link copied to clipboard!', 'success');
                          }}
                          className="px-2.5 py-1 text-[9px] font-bold uppercase tracking-wider text-stone-700 hover:text-stone-900 bg-white hover:bg-stone-50 border border-stone-300 rounded shadow-3xs cursor-pointer dark:bg-stone-900 dark:border-stone-700 dark:text-stone-300 dark:hover:bg-stone-800 transition-all text-center"
                        >
                          Copy
                        </button>
                      </div>

                      {/* 💡 Google Sheets Permission & Multi-Account Troubleshooting notice */}
                      <div className="p-3 bg-amber-50/70 border border-amber-200/60 rounded-lg text-[10.5px] text-amber-900 dark:bg-amber-950/20 dark:border-amber-900/40 dark:text-amber-300 space-y-1.5 leading-relaxed">
                        <div className="font-bold flex items-center gap-1">
                          <span>💡 Facing a "File requested does not exist" error?</span>
                        </div>
                        <p>
                          This is a common Google security/multi-account behavior. Standard sheets are private to your Google Account by default. If your browser's primary account is different from the account you authorized with our app, Google will claim the file does not exist.
                        </p>
                        <div className="space-y-1 pt-1 font-serif text-[10px] italic">
                          <div>• <strong>Solution 1:</strong> Click <strong>Copy</strong> above and paste the URL into a browser tab signed in to your correct Google account.</div>
                          <div>• <strong>Solution 2:</strong> In the Google Sheet, click <strong>Share</strong> and grant "Anyone with the link can view" to allow general access.</div>
                          <div>• <strong>Solution 3:</strong> If using the <strong>Default Master Database</strong>, it is a published file: use <strong>Open Live Web-View</strong> below instead of a private edit link.</div>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {/* View Button */}
                    <a
                      href={spreadsheetUrls.viewUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center justify-center gap-2 px-3 py-2.5 bg-stone-100 hover:bg-stone-200 dark:bg-stone-900 dark:hover:bg-stone-850 hover:text-stone-950 dark:hover:text-white text-stone-700 dark:text-stone-300 text-[10px] font-bold uppercase tracking-wider rounded-lg border border-stone-200 dark:border-stone-800 transition-all text-center cursor-pointer"
                    >
                      <ExternalLink className="w-3.5 h-3.5 opacity-80" />
                      <span>Open Live Web-View</span>
                    </a>

                    {/* Download Excel */}
                    <a
                      href={spreadsheetUrls.downloadXlsx}
                      className="inline-flex items-center justify-center gap-2 px-3 py-2.5 bg-emerald-50/50 hover:bg-emerald-50 dark:bg-emerald-950/20 dark:hover:bg-emerald-950/30 text-emerald-800 dark:text-emerald-400 text-[10px] font-bold uppercase tracking-wider rounded-lg border border-emerald-200/60 dark:border-emerald-900/60 transition-all text-center cursor-pointer font-sans"
                      title="Download the entire spreadsheet database as a Microsoft Excel sheet"
                    >
                      <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                      <span>Download Excel</span>
                      <Download className="w-3.5 h-3 opacity-70" />
                    </a>
                  </div>
                </div>

                {/* 4. Active Spreadsheet Database Link (ONLY visible to admins) */}
                {isActuallyAdmin && (
                  <div className="bg-white border border-stone-200 p-4 rounded-xl shadow-xs">
                    <div className="text-left mb-3">
                      <span className="text-[10px] font-mono font-extrabold text-stone-500 uppercase tracking-widest block">
                        Google Sheet Database Connection
                      </span>
                      <p className="text-[10px] text-stone-500 font-serif italic mt-0.5">
                        Type or paste your public Google Spreadsheet ID or full Spreadsheet URL to load your own real-time global news feed.
                      </p>
                    </div>

                    <div className="flex gap-2">
                      <input
                        type="text"
                        placeholder="Paste google spreadsheet ID or link"
                        value={selectedSheetId || ''}
                        onChange={(e) => {
                          let val = e.target.value.trim();
                          let parsedGid = '';
                          
                          // Extract spreadsheet ID and gid if they paste the full URL (supporting e/2PACX-... as well)
                          const pubMatch = val.match(/\/spreadsheets\/d\/(e\/[a-zA-Z0-9-_]+)/);
                          const match = val.match(/\/spreadsheets\/d\/([a-zA-Z0-9-_]+)/);
                          
                          if (pubMatch) {
                            val = pubMatch[1];
                          } else if (match) {
                            val = match[1];
                          }

                          // Parse gid from query parameters or URL hash (e.g. ?gid=123, &gid=123 or #gid=123)
                          const gidMatch = e.target.value.match(/[?&#]gid=([0-9]+)/);
                          if (gidMatch) {
                            parsedGid = gidMatch[1];
                          }
                          
                          setSelectedSheetId(val);
                          setSharedSheetId(val);
                          localStorage.setItem('custom_spreadsheet_id', val);
   
                          setSelectedGid(parsedGid);
                          if (parsedGid) {
                            localStorage.setItem('custom_spreadsheet_gid', parsedGid);
                            addToast(
                              'Parsed Tab GID',
                              `Active sheet tab ID targeted: ${parsedGid}`,
                              'success'
                            );
                          } else {
                            localStorage.removeItem('custom_spreadsheet_gid');
                          }
                        }}
                        className="flex-1 bg-white border border-stone-300 rounded-lg px-3 py-1.5 text-xs text-stone-900 focus:outline-none focus:ring-1 focus:ring-red-700 font-mono shadow-sm"
                      />
                      <button
                        onClick={() => {
                          if (selectedSheetId) {
                            loadPublicSheetMetadata(selectedSheetId);
                            addToast(
                              'Connecting Sheet',
                              'Initiating public sheets server proxy connection query.',
                              'info'
                            );
                          }
                        }}
                        className="px-3.5 py-1.5 bg-stone-900 hover:bg-stone-850 text-white text-[10px] font-bold uppercase tracking-wider rounded-lg border border-black cursor-pointer transition-all shrink-0 shadow-sm"
                      >
                        Fetch Sheet
                      </button>
                    </div>
                    {selectedSheetId && (
                      <div className="mt-2 text-[10px] font-mono text-stone-500 flex flex-col gap-1 border-t border-stone-100 pt-2">
                        <div className="flex items-center justify-between">
                          <span className="truncate max-w-[280px]">Active ID: {selectedSheetId}</span>
                          <button
                            onClick={() => {
                              const originalId = 'e/2PACX-1vSesHAf2i4cSydOiMSszcwC1sRz7yh6tiyVSQqbgAtnczqjqlwNhuw4nM-yjCeYL4OHNQkUq1y2K0t6';
                              setSelectedSheetId(originalId);
                              setSharedSheetId(originalId);
                              setSelectedGid('');
                              localStorage.removeItem('custom_spreadsheet_id');
                              localStorage.removeItem('custom_spreadsheet_gid');
                              loadPublicSheetMetadata(originalId);
                              addToast(
                                'Restored Default',
                                'Reset configuration to system primary daily sheets database.',
                                'info'
                              );
                            }}
                            className="text-red-700 hover:underline cursor-pointer bg-transparent border-none text-[9px] uppercase font-bold"
                          >
                            Reset to Default
                          </button>
                        </div>
                        {selectedGid && (
                          <div className="text-red-700 font-bold flex items-center gap-1">
                            <span className="w-1.5 h-1.5 rounded-full bg-red-700"></span>
                            Targeting specific tab Gid: {selectedGid} (Sheet list bypassed to load this tab directly)
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                )}

                {/* 👑 ADMIN DESK: Absolute Database Seeder & Live Grid Proof */}
                {isActuallyAdmin ? (
                  <div className="bg-red-50/50 border border-red-200/85 p-4 rounded-xl mt-4 space-y-4">
                    <div className="flex items-center gap-2 pb-2 border-b border-red-250 justify-between">
                      <div className="flex items-center gap-1.5">
                        <span className="w-2.5 h-2.5 rounded-full bg-red-700 animate-pulse shrink-0" />
                        <span className="text-[11px] font-mono font-extrabold text-red-855 uppercase tracking-widest">
                          Admin Desk (Database Config)
                        </span>
                      </div>
                      <span className="px-2 py-0.5 rounded bg-red-700 text-white font-mono text-[8px] uppercase tracking-normal font-extrabold">
                        Authorized Role
                      </span>
                    </div>

                    {/* Google Sheets Sync Integration (Admin Control) */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      
                      {/* Left: Google Sheets dropdown & connection */}
                      <div className="bg-white p-3 rounded-lg border border-stone-200 shadow-2xs space-y-2">
                        <span className="text-[9px] font-mono font-bold text-stone-500 uppercase block">SPREADSHEET LINK</span>
                        {isSandboxMode ? (
                          <div className="text-[11px] text-stone-600 bg-stone-100 p-2 rounded font-serif italic leading-snug">
                            Running in <strong>Sandbox Mode</strong>. Standard sheets operations are simulated in local state.
                          </div>
                        ) : (
                          <div className="space-y-2">
                            {spreadsheets.length > 0 ? (
                              <select
                                value={selectedSheetId || ''}
                                onChange={(e) => setSelectedSheetId(e.target.value)}
                                className="w-full bg-white border border-stone-300 rounded px-2.5 py-1 text-xs text-stone-900 font-bold focus:outline-none focus:border-stone-500"
                              >
                                {spreadsheets.map((s) => (
                                  <option key={s.id} value={s.id}>
                                    {s.name}
                                  </option>
                                ))}
                              </select>
                            ) : (
                              <span className="text-xs text-stone-500 italic block">No active sheets database.</span>
                            )}

                            <button
                              onClick={handleCreateNewSheet}
                              disabled={loadingSheets}
                              className="w-full inline-flex items-center justify-center gap-1 px-2 py-1 bg-stone-900 hover:bg-stone-850 text-white text-[9px] font-bold tracking-wider uppercase rounded disabled:opacity-40 cursor-pointer border border-black"
                            >
                              {loadingSheets ? <Loader2 className="w-3 h-3 animate-spin" /> : <Plus className="w-3 h-3" />}
                              <span>Init Sheets Database</span>
                            </button>
                          </div>
                        )}
                      </div>

                      {/* Right: Custom sheet date tab creation */}
                      <div className="bg-white p-3 rounded-lg border border-stone-200 shadow-2xs space-y-2">
                        <span className="text-[9px] font-mono font-bold text-stone-500 uppercase block">CREATE NEW DATE TAB</span>
                        
                        <div className="flex gap-1.5">
                          <input
                            type="text"
                            maxLength={10}
                            placeholder="e.g. 2026-06-25"
                            value={customDateValue}
                            onChange={(e) => setCustomDateValue(e.target.value)}
                            className="flex-1 bg-white border border-stone-300 rounded px-2 py-1 text-xs text-stone-900 placeholder-stone-400 font-mono"
                          />
                          <button
                            onClick={async () => {
                              if (!/^\d{4}-\d{2}-\d{2}$/.test(customDateValue)) {
                                alert('Date must be formatted in YYYY-MM-DD format (e.g. 2026-06-20)');
                                return;
                              }
                              await handleAddNewDateTab(customDateValue);
                              setCustomDateValue('');
                            }}
                            className="px-2.5 py-1 bg-stone-900 hover:bg-stone-850 text-white font-extrabold uppercase text-[9px] rounded cursor-pointer border border-black"
                          >
                            Add
                          </button>
                        </div>
                        <p className="text-[9px] text-stone-550 font-serif">Adds representing a custom news edition date inside the Sheet database.</p>
                      </div>

                    </div>

                    {/* Hourly Sync Automator and 500-News Bulk Seeder */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-1">
                      
                      {/* Harvester Auto-refresh section */}
                      <div className="bg-white p-3 rounded-lg border border-stone-200 shadow-2xs space-y-2">
                        <div className="flex items-center justify-between">
                          <span className="text-[9px] font-mono font-bold text-stone-500 uppercase">AUTO-HARVEST STATUS</span>
                          <span className="px-1 py-0.5 rounded bg-emerald-700 text-white font-mono text-[7px] uppercase tracking-normal font-extrabold">Every 1 Hour</span>
                        </div>
                        <p className="text-[10px] text-stone-605 font-serif leading-tight">
                          Refresh the active dashboard view with cached spreadsheet values, or trigger a fresh real-time web news harvest via Gemini 3.5 Flash & Google Search grounding to rewrite the database tab.
                        </p>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1">
                          <button
                            onClick={handleLoadAIPortalNews}
                            disabled={isAiLoading || (!isSandboxMode && (!selectedSheetId || !selectedDate))}
                            className="w-full inline-flex items-center justify-center gap-1.5 px-3 py-1.5 bg-stone-100 hover:bg-stone-200 disabled:bg-stone-50 disabled:text-stone-400 text-stone-800 text-[9px] font-bold uppercase tracking-wider rounded border border-stone-350 cursor-pointer shadow-3xs"
                            title="Load already-saved news records from the spreadsheet tab"
                          >
                            {isAiLoading ? (
                              <Loader2 className="w-3 h-3 animate-spin text-stone-500" />
                            ) : (
                              <Database className="w-3 h-3 text-stone-600" />
                            )}
                            <span>Fetch Cached</span>
                          </button>

                          <button
                            onClick={handleGenerateLiveNews}
                            disabled={isAiLoading || (!isSandboxMode && (!selectedSheetId || !selectedDate))}
                            className="w-full inline-flex items-center justify-center gap-1.5 px-3 py-1.5 bg-rose-700 hover:bg-rose-800 disabled:bg-stone-100 disabled:text-stone-400 text-white text-[9px] font-bold uppercase tracking-wider rounded border border-rose-800 cursor-pointer shadow-2xs"
                            title="Query Google Search via Gemini 3.5 Flash to harvest real-time market updates, then overwrite database sheet"
                          >
                            {isAiLoading ? (
                              <Loader2 className="w-3 h-3 animate-spin text-white" />
                            ) : (
                              <RefreshCw className="w-3 h-3 text-white" />
                            )}
                            <span>Harvest Live AI</span>
                          </button>
                        </div>
                      </div>

                      {/* Seeding section */}
                      <div className="bg-white p-3 rounded-lg border border-stone-200 shadow-2xs space-y-2">
                        <div className="flex items-center justify-between">
                          <span className="text-[9px] font-mono font-bold text-stone-500 uppercase">BULK HISTORICAL SEEDER</span>
                          <select
                            value={seedDurationDays}
                            onChange={(e) => setSeedDurationDays(Number(e.target.value))}
                            className="bg-stone-50 border border-stone-300 rounded px-1.5 py-0.5 text-[9px] font-mono font-bold text-stone-700 outline-none cursor-pointer"
                          >
                            <option value={7}>1-WEEK (7 DAYS)</option>
                            <option value={30}>1-MONTH (30 DAYS)</option>
                          </select>
                        </div>
                        <p className="text-[10px] text-stone-605 font-serif leading-tight">
                          Refresh and seed the database with robust pre-categorized news stories spanning the chosen period ({seedDurationDays === 30 ? '30 days, ~2,200 news' : '7 days, ~500 news'}).
                        </p>
                        <button
                          onClick={handleBulkSeedPastWeek}
                          disabled={isSyncing || loadingSheets}
                          className="w-full inline-flex items-center justify-center gap-1.5 px-3 py-1.5 bg-red-700 hover:bg-red-800 disabled:opacity-40 text-white text-[9px] font-bold uppercase tracking-wider rounded border border-red-800 cursor-pointer shadow-sm transform active:scale-95 transition-all"
                        >
                          {isSyncing ? (
                            <>
                              <Loader2 className="w-3 h-3 animate-spin" />
                              <span>Seeding {seedDurationDays === 30 ? '30 Days' : '7 Days'}...</span>
                            </>
                          ) : (
                            <>
                              <Sparkles className="w-3.5 h-3.5 animate-bounce text-stone-200" />
                              <span>Seed {seedDurationDays === 30 ? '30-Day Timeline' : '1-Week Timeline'}</span>
                            </>
                          )}
                        </button>
                      </div>

                    </div>

                    {/* Google Sheet Live Grid Inspector */}
                    <div className="bg-white p-3 rounded-lg border border-stone-200 shadow-2xs space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-[9px] font-mono font-extrabold text-[#1A1A1A] uppercase tracking-widest block">
                          Spreadsheet Live Data Grid ({newsItems.length} Records)
                        </span>
                        <span className="text-[8px] font-mono text-stone-400">Current tab preview</span>
                      </div>

                      <div className="border border-stone-200 rounded-lg overflow-hidden text-[10px] font-mono">
                        <div className="bg-stone-100 px-3 py-1.5 font-bold text-stone-700 border-b border-stone-200 grid grid-cols-12 gap-1.5 uppercase tracking-wider">
                          <div className="col-span-8">Title / Announcement</div>
                          <div className="col-span-2 text-right">Scope</div>
                          <div className="col-span-2 text-right">Impact</div>
                        </div>

                        <div className="max-h-[140px] overflow-y-auto divide-y divide-stone-150 bg-stone-50/50">
                          {newsItems.length > 0 ? (
                            newsItems.map((item, idx) => (
                              <div key={item.id || idx} className="px-3 py-1.5 grid grid-cols-12 gap-1.5 text-stone-800 hover:bg-stone-100 transition-all">
                                <div className="col-span-8 truncate font-serif text-[11px]" title={item.title}>
                                  {item.title}
                                </div>
                                <div className="col-span-2 text-right font-extrabold uppercase text-[9px] text-stone-500">
                                  {item.level}
                                </div>
                                <div className={`col-span-2 text-right font-bold ${
                                  (item.changePercent || 0) >= 0 ? "text-emerald-700" : "text-rose-700"
                                }`}>
                                  {item.changePercent ? `${item.changePercent > 0 ? '+' : ''}${item.changePercent}%` : '0%'}
                                </div>
                              </div>
                            ))
                          ) : (
                            <div className="p-4 text-center text-stone-400 italic">
                              No records found for active date tab. Use the bulk seeder or database refresh to fetch now!
                            </div>
                          )}
                        </div>
                      </div>
                    </div>

                  </div>
                ) : null}

              </div>

              {/* Action Apply & Close */}
              <div className="mt-6 flex justify-end">
                <button
                  onClick={() => setIsSettingsOpen(false)}
                  className="px-4 py-2 h-9 bg-stone-900 hover:bg-[#1A1A1A] border border-black text-white text-xs font-bold uppercase tracking-wider rounded-lg transition-all cursor-pointer shadow-sm"
                >
                  Apply & Close
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Global Action Footer */}
      {(!isMindMapVisible && (currentUser || isSandboxMode || selectedSheetId)) && (
        <div className="fixed bottom-0 left-0 right-0 h-14 bg-white/95 dark:bg-stone-900/95 backdrop-blur-md border-t border-stone-200 dark:border-stone-800 z-[100] flex items-center justify-center px-4 shadow-[0_-4px_20px_rgba(0,0,0,0.05)]">
          <div className="flex items-center gap-2 sm:gap-4 md:gap-6 max-w-full">
             <button onClick={() => activeItem && handleInteraction('like', activeItem.id)} className={`p-2 sm:p-2.5 rounded-full transition-colors shadow-sm ${activeItem && userInteractions[activeItem.id]?.liked ? 'bg-green-50 border-green-300 text-green-600 dark:bg-green-900/40 dark:border-green-800 dark:text-green-400' : 'text-stone-500 dark:text-stone-400 hover:text-green-600 hover:bg-stone-100 dark:hover:bg-stone-800'}`} title="Show more like this">
               <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill={activeItem && userInteractions[activeItem.id]?.liked ? "currentColor" : "none"} stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M7 10v12"/><path d="M15 5.88 14 10h5.83a2 2 0 0 1 1.92 2.56l-2.33 8A2 2 0 0 1 17.5 22H4a2 2 0 0 1-2-2v-8a2 2 0 0 1 2-2h2.76a2 2 0 0 0 1.79-1.11L12 2h0a3.13 3.13 0 0 1 3 3.88Z"/></svg>
             </button>
             <button onClick={() => activeItem && handleInteraction('dislike', activeItem.id)} className={`p-2 sm:p-2.5 rounded-full transition-colors shadow-sm ${activeItem && userInteractions[activeItem.id]?.disliked ? 'bg-red-50 border-red-300 text-red-600 dark:bg-red-900/40 dark:border-red-800 dark:text-red-400' : 'text-stone-500 dark:text-stone-400 hover:text-red-600 hover:bg-stone-100 dark:hover:bg-stone-800'}`} title="Show less like this">
               <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill={activeItem && userInteractions[activeItem.id]?.disliked ? "currentColor" : "none"} stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17 14V2"/><path d="M9 18.12 10 14H4.17a2 2 0 0 1-1.92-2.56l2.33-8A2 2 0 0 1 6.5 2H20a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2h-2.76a2 2 0 0 0-1.79 1.11L12 22h0a3.13 3.13 0 0 1-3-3.88Z"/></svg>
             </button>
             <button onClick={() => activeItem && handleInteraction('star', activeItem.id)} className={`p-2 sm:p-2.5 rounded-full transition-colors shadow-sm ${activeItem && userInteractions[activeItem.id]?.starred ? 'bg-amber-50 border-amber-300 text-amber-500 dark:bg-amber-900/40 dark:border-amber-800 dark:text-amber-400' : 'text-stone-500 dark:text-stone-400 hover:text-amber-500 hover:bg-stone-100 dark:hover:bg-stone-800'}`} title="Bookmark">
               <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill={activeItem && userInteractions[activeItem.id]?.starred ? "currentColor" : "none"} stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>
             </button>
             <button 
               onClick={() => setIsVerticalFullscreenOpen(true)} 
               className="p-2 sm:p-2.5 rounded-full transition-colors shadow-sm text-stone-500 dark:text-stone-400 hover:text-red-700 dark:hover:text-red-500 hover:bg-stone-100 dark:hover:bg-stone-800 flex items-center justify-center cursor-pointer" 
               title="View Hierarchy Mindmap"
             >
               <Layers className="w-5 h-5" />
             </button>
             <div className="w-[1px] h-6 bg-stone-300 dark:bg-stone-700 mx-1" />
             
             {/* Dynamic Unread Pill and Inline Refresh */}
             <div className="flex items-center gap-2 bg-stone-50 dark:bg-stone-800 border border-stone-250 dark:border-stone-700 rounded-full px-2.5 py-1" title="Unread status and refresh">
               <div className="flex items-center gap-1.5 font-mono text-[10px] font-bold text-stone-600 dark:text-stone-300">
                 <span className={`w-1.5 h-1.5 rounded-full ${totalUnreadCount > 0 ? 'bg-rose-500 animate-pulse' : 'bg-emerald-500'}`} />
                 <span>{totalUnreadCount} UNREAD</span>
               </div>
               
               <div className="w-[1px] h-3 bg-stone-200 dark:bg-stone-700" />

               <button
                 onClick={handleRefreshFeed}
                 disabled={isSyncing}
                 className={`p-0.5 rounded-md hover:bg-stone-200 dark:hover:bg-stone-700 text-stone-500 dark:text-stone-400 hover:text-stone-800 dark:hover:text-white transition-all cursor-pointer ${isSyncing ? 'animate-spin pointer-events-none text-rose-600' : ''}`}
                 title="Synchronize and Refresh Feed"
               >
                 <RefreshCw className="w-3.5 h-3.5" />
               </button>
             </div>

             <div className="w-[1px] h-6 bg-stone-300 dark:bg-stone-700 mx-1 hidden sm:block" />
             <div className="flex items-center gap-1.5" title="Toggle Theme">
               <span className="text-sm leading-none">☀️</span>
               <div 
                 onClick={() => setIsDarkMode(!isDarkMode)} 
                 className="w-9 h-5 bg-stone-300 dark:bg-stone-700 rounded-full relative cursor-pointer flex items-center px-0.5 transition-colors"
               >
                 <div className={`w-4 h-4 bg-white rounded-full shadow-md transition-transform duration-200 transform ${isDarkMode ? 'translate-x-4' : 'translate-x-0'}`} />
               </div>
               <span className="text-sm leading-none">🌙</span>
             </div>
          </div>
        </div>
      )}

      {/* Floating Real-Time Toast Notifications List Container */}
      <div className="fixed top-6 right-6 z-[120] flex flex-col gap-2 max-w-sm w-full pointer-events-none">
        <AnimatePresence>
          {toasts.map((toast) => (
            <motion.div
              key={toast.id}
              initial={{ opacity: 0, y: -15, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9, transition: { duration: 0.2 } }}
              className="pointer-events-auto bg-white/95 backdrop-blur-md shadow-lg border border-stone-200 p-3.5 rounded-xl flex items-start gap-3 text-left overflow-hidden min-h-[48px]"
            >
              <div className="shrink-0 mt-0.5">
                {toast.type === 'success' && <CheckCircle2 className="w-4.5 h-4.5 text-emerald-600 font-bold" />}
                {toast.type === 'warning' && <AlertTriangle className="w-4.5 h-4.5 text-amber-500" />}
                {toast.type === 'error' && <XCircle className="w-4.5 h-4.5 text-rose-500" />}
                {toast.type === 'info' && <Info className="w-4.5 h-4.5 text-blue-500" />}
              </div>
              <div className="flex-1 space-y-0.5">
                <h4 className="text-[11px] font-mono font-bold uppercase tracking-wider text-stone-900 leading-none">
                  {toast.title}
                </h4>
                <p className="text-[11.5px] font-serif text-stone-600 leading-normal">
                  {toast.description}
                </p>
              </div>
              <button
                onClick={() => setToasts(prev => prev.filter(t => t.id !== toast.id))}
                className="shrink-0 text-stone-400 hover:text-stone-600 transition-colors cursor-pointer"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>

      {/* Immersive Fullscreen Interactive Top-to-Bottom Mind Map */}
      <AnimatePresence>
        {isVerticalFullscreenOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-[#FCFAF7]/98 dark:bg-stone-900/98 backdrop-blur-md z-[110] flex flex-col font-sans text-stone-900 dark:text-stone-100"
          >
            {/* Fullscreen Header */}
            <header className="p-4 bg-white/50 dark:bg-stone-950/50 border-b border-stone-200 dark:border-stone-800 flex items-center justify-between shrink-0">
              <div className="flex items-center gap-3">
                <Layers className="w-5 h-5 text-red-700 dark:text-red-500 animate-pulse" />
                <div>
                  <h2 className="text-sm uppercase font-extrabold tracking-wider">Fullscreen Hierarchical Mindmap</h2>
                  <p className="text-[10px] text-stone-600 dark:text-stone-400 font-mono">
                    Top-to-Bottom editorial pathways. Click nodes to pivot active card target instantly.
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <span className="text-[10.5px] bg-stone-100 dark:bg-stone-900/60 border border-stone-200 dark:border-stone-850 px-2.5 py-1 rounded font-mono font-extrabold text-stone-500">
                  ESC KEY TO CLOSE
                </span>
                <button
                  onClick={() => setIsVerticalFullscreenOpen(false)}
                  className="p-1 px-3.5 h-8 rounded-lg border border-stone-200 dark:border-stone-700 text-stone-500 hover:text-stone-900 dark:hover:text-white hover:bg-stone-100 dark:hover:bg-stone-800 transition-all cursor-pointer bg-white dark:bg-stone-900 text-xs font-bold uppercase tracking-wide flex items-center gap-1.5"
                >
                  <X className="w-4 h-4" />
                  <span>Exit Fullscreen</span>
                </button>
              </div>
            </header>

            {/* Main Visualizer Stage */}
            <div className="flex-1 p-6 overflow-hidden flex flex-col">
              <VerticalHierarchyMap
                newsItems={newsItems}
                activeNewsId={activeNewsId}
                heightClass="h-full"
                onSelectNode={(itemId) => {
                  setActiveNewsId(itemId);
                  addToast(
                    'Pivoted Focus',
                    `Repositioned active slide target to node: ${itemId}`,
                    'success'
                  );
                }}
              />
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Help & Guide Modal (Overlay) */}
      <AnimatePresence>
        {isHelpOpen && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-stone-900/70 backdrop-blur-sm overflow-y-auto">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-[#FCFAF7] border border-stone-300 w-full max-w-2xl rounded-2xl p-6 md:p-8 shadow-2xl relative text-stone-900 font-sans"
            >
              {/* Close Button */}
              <button
                onClick={() => setIsHelpOpen(false)}
                className="absolute top-4 right-4 text-stone-400 hover:text-stone-700 transition-colors h-8 w-8 rounded-full hover:bg-stone-100 flex items-center justify-center cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>

              <div className="flex items-center gap-2 mb-4">
                <div className="p-1 px-2.5 bg-amber-50 text-amber-800 rounded border border-amber-200 text-[9px] font-mono font-extrabold uppercase">
                  Interactive Guidance
                </div>
                <h3 className="text-xl font-serif font-black tracking-tight flex items-center gap-2">
                  <HelpCircle className="w-5 h-5 text-amber-600 shrink-0" />
                  Hierarchy News Multiplatform Guide
                </h3>
              </div>

              <p className="text-sm text-stone-650 font-serif leading-relaxed mb-6 italic border-l-4 border-amber-500 pl-4 py-0.5">
                Learn how this zero-database hierarchical news micro-deck scales flawlessly across Android / iOS phones, tablets, laptops, and manages secure Admin vs. Reader data flows.
              </p>

              {/* Three Column Bento Help Breakdown */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-left">
                {/* 1. Laptop / Desktop Guide */}
                <div className="bg-white p-4.5 rounded-xl border border-stone-200 shadow-3xs flex flex-col justify-between">
                  <div>
                    <span className="text-[9px] font-mono font-bold text-stone-450 uppercase block mb-1.5">LAPTOP & WORKSTATIONS</span>
                    <h4 className="text-xs font-extrabold text-stone-900 mb-2 uppercase font-sans tracking-wide">Workstation Layout</h4>
                    <p className="text-[11px] leading-relaxed text-stone-600 font-serif">
                      Turn <strong>Display Mindmap</strong> in Settings to <strong>ON</strong>. Drag/pan nodes to inspect tree branches. Press <strong>Keyboard Arrows</strong> to flip stories (Up/Down) or plunge levels (Left/Right) instantly.
                    </p>
                  </div>
                  <div className="mt-3 text-[9px] font-mono font-bold text-amber-700 bg-amber-50 rounded px-1.5 py-0.5 self-start">
                    Keyboard & Clicking
                  </div>
                </div>

                {/* 2. Phone / Tablet Guide */}
                <div className="bg-white p-4.5 rounded-xl border border-stone-200 shadow-3xs flex flex-col justify-between">
                  <div>
                    <span className="text-[9px] font-mono font-bold text-stone-450 uppercase block mb-1.5">MOBILE & TABLETS</span>
                    <h4 className="text-xs font-extrabold text-stone-900 mb-2 uppercase font-sans tracking-wide">Touch Viewports (iOS & Android)</h4>
                    <p className="text-[11px] leading-relaxed text-stone-600 font-serif">
                      Turn <strong>Display Mindmap</strong> to <strong>OFF</strong> for full-screen immersive deck reading. <strong>Swipe up or down</strong> anywhere on the card to cycle stories. <strong>Swipe left or right</strong> to travel deep into child categories.
                    </p>
                  </div>
                  <div className="mt-3 text-[9px] font-mono font-bold text-red-700 bg-red-50 rounded px-1.5 py-0.5 self-start">
                    Touch & Swipe Gestures
                  </div>
                </div>

                {/* 3. Roles Guide */}
                <div className="bg-white p-4.5 rounded-xl border border-stone-200 shadow-3xs flex flex-col justify-between">
                  <div>
                    <span className="text-[9px] font-mono font-bold text-stone-450 uppercase block mb-1.5">USER ROLES</span>
                    <h4 className="text-xs font-extrabold text-stone-900 mb-2 uppercase font-sans tracking-wide">Reader vs. Administrator</h4>
                    <p className="text-[11px] leading-relaxed text-stone-600 font-serif">
                      <strong>Administrator Mode:</strong> Link Google Drive, create dates tabs, write direct custom financial stories via Admin panel, and seed historical entries.<br/>
                      <strong>Reader Mode:</strong> Clean high-contrast reading layout with progress and unread meters.
                    </p>
                  </div>
                  <div className="mt-3 text-[9px] font-mono font-bold text-stone-750 bg-stone-150 rounded px-1.5 py-0.5 self-start">
                    Email: saurabhsks01@gmail.com
                  </div>
                </div>
              </div>

              {/* Zero-Database Google Sheet Mechanics Info Card */}
              <div className="mt-6 bg-stone-100 p-4 border border-stone-200 rounded-xl text-left">
                <span className="text-[9px] font-mono font-bold text-stone-550 uppercase block mb-1">
                  UNDER-THE-HOOD: GOOGLE SHEETS SCHEMALESS SYNC
                </span>
                <p className="text-[11px] text-stone-600 leading-relaxed font-serif">
                  Every tabular sheet represents a dynamic news date. News rows are pre-categorized in <strong>Hierarchical Levels (Global → Continent → Country → Region → Micro → Stock)</strong>. Impact and parent mappings dictate child relations in the live deck. Falling back seamlessly to the local Sandbox if sheets are private (401) ensures zero service degradation!
                </p>
              </div>

              <div className="mt-6 flex justify-end">
                <button
                  onClick={() => setIsHelpOpen(false)}
                  className="px-4 py-2 bg-stone-900 hover:bg-[#1A1A1A] text-white text-xs font-bold uppercase tracking-wider rounded-lg transition-all cursor-pointer shadow-sm hover:shadow"
                >
                  Got It, Proceed
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

    </div>
  );
}
