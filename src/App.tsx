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
  X
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

// High impact sample fallback dataset used for Sandbox exploration
const SANDBOX_MOCKED_DATE = '2026-06-19';
const SANDBOX_NEWS: NewsItem[] = [
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
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [authToken, setAuthToken] = useState<string | null>(null);
  const [isAuthLoading, setIsAuthLoading] = useState(true);

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
  const [dateRange, setDateRange] = useState<'1day' | '1week' | '1month' | '1quarter'>('1day');

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
  const [sheetInfo, setSheetInfo] = useState<SpreadsheetInfo | null>(null);
  const [selectedDate, setSelectedDate] = useState<string>('');

  // News items data structure state
  const [isSyncing, setIsSyncing] = useState(false);
  const [errorStatus, setErrorStatus] = useState<string | null>(null);
  const [newsItems, setNewsItems] = useState<NewsItem[]>([]);

  // Current reader focused card tracking ID
  const [activeNewsId, setActiveNewsId] = useState<string | null>(null);

  // Track active news item as read
  useEffect(() => {
    if (activeNewsId) {
      setReadNewsIds(prev => {
        if (prev[activeNewsId]) return prev;
        const updated = { ...prev, [activeNewsId]: true };
        localStorage.setItem('read_news_ids_v1', JSON.stringify(updated));
        return updated;
      });
    }
  }, [activeNewsId]);

  // Custom picker for adding custom dates
  const [customDateValue, setCustomDateValue] = useState('');
  const [showCustomDatePrompt, setShowCustomDatePrompt] = useState(false);
  const [isAiLoading, setIsAiLoading] = useState(false);
  const [apiNotice, setApiNotice] = useState<string | null>(null);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);

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
    const initSharedConfig = async () => {
      try {
        const res = await fetch('/api/config');
        if (res.ok) {
          const data = await res.json();
          if (data?.selectedSheetId) {
            setSharedSheetId(data.selectedSheetId);
            setSelectedSheetId(data.selectedSheetId);
          }
        }
      } catch (err) {
        console.error('Error loading default spreadsheet config:', err);
      }
    };

    const params = new URLSearchParams(window.location.search);
    if (params.get('admin') === 'true') {
      setIsAdminMode(true);
    }

    initSharedConfig();

    const unsubscribe = initAuth(
      (user, token) => {
        setCurrentUser(user);
        setAuthToken(token);
        setIsAuthLoading(false);
      },
      () => {
        setCurrentUser(null);
        setAuthToken(null);
        setIsAuthLoading(false);
      }
    );
    return () => unsubscribe();
  }, []);

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
    try {
      const list = await listUserSpreadsheets(authToken);
      setSpreadsheets(list);
      
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
      setErrorStatus(err.message || 'Failed listing spreadsheets in Drive.');
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
    try {
      const res = await fetch(`/api/public-sheet-info?spreadsheetId=${sheetId}`);
      if (!res.ok) {
        throw new Error(`Failed to load sheet metadata from server proxy.`);
      }
      const info = await res.json();
      setSheetInfo(info);
      if (info.tabs && info.tabs.length > 0) {
        setSelectedDate(info.tabs[0]); // newest date
      } else {
        setSelectedDate(todayDateStr);
      }
    } catch (err: any) {
      console.error(err);
      setErrorStatus(err.message || 'Error parsing sheets schema metadata via server proxy.');
    } finally {
      setLoadingSheets(false);
    }
  };

  const loadSheetMetadata = async () => {
    if (!authToken || !selectedSheetId) return;
    setLoadingSheets(true);
    setErrorStatus(null);
    try {
      const info = await fetchSpreadsheetInfo(authToken, selectedSheetId);
      setSheetInfo(info);
      if (info.tabs.length > 0) {
        setSelectedDate(info.tabs[0]); // newest date
      } else {
        // Automatically create and seed tab for today
        await handleAddNewDateTab(todayDateStr);
      }
    } catch (err: any) {
      console.error(err);
      setErrorStatus(err.message || 'Error parsing sheets schema.');
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
      setErrorStatus(err.message || 'Could not load rows from designated sheet date tabs.');
    } finally {
      setIsSyncing(false);
    }
  };

  const fetchPublicNewsFromTab = async (spreadsheetId: string, dateStr: string): Promise<NewsItem[]> => {
    try {
      const res = await fetch(`/api/public-sheet-news?spreadsheetId=${spreadsheetId}&date=${encodeURIComponent(dateStr)}`);
      if (!res.ok) return [];
      const data = await res.json();
      return data.newsItems || [];
    } catch (err) {
      console.error('Error fetching public tab news:', err);
      return [];
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
      console.error(err);
      setErrorStatus(err.message || 'Could not fetch public sheets contents.');
    } finally {
      setIsSyncing(false);
    }
  };

  // Start standalone sandbox demo workspace
  const handleStartSandbox = () => {
    setIsSandboxMode(true);
    setSandboxNewsStore(SANDBOX_NEWS);
    setSandboxDates(['2026-06-19']);
    setSandboxActiveDate('2026-06-19');
    setNewsItems(SANDBOX_NEWS);
    setActiveNewsId('G1');
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
    await logout();
    setCurrentUser(null);
    setAuthToken(null);
    setIsSandboxMode(false);
    setNewsItems([]);
    setActiveNewsId(null);
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
      setErrorStatus(err.message || 'Failed adding a date tab.');
    } finally {
      setIsSyncing(false);
    }
  };

  const handleBulkSeedPastWeek = async () => {
    setIsSyncing(true);
    setErrorStatus(null);
    setApiNotice(null);

    if (isSandboxMode) {
      try {
        console.log(`[Sandbox Weekly Seeding] Simulating 500+ stories locally...`);
        // Use active date as the baseline
        const generated = generateLastWeek500News(sandboxActiveDate);
        setSandboxNewsStore(generated);
        
        // Find unique dates and arrange chronologically (newest first)
        const uniqDates = Array.from(new Set(generated.map(x => x.date))).sort((a, b) => b.localeCompare(a));
        setSandboxDates(uniqDates);
        setSandboxActiveDate(uniqDates[0]);
        
        setApiNotice(`Successfully simulated 7 days of timeline history with 518 pre-categorized news items in Sandbox mode memory! Try selecting dates inside Settings!`);
      } catch (err: any) {
        console.error(err);
        setErrorStatus(err.message || 'Error simulating sandbox data.');
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
      console.log(`[Weekly Seeding] Seeding 500+ stories across 7 tabs to Google Sheet...`);
      const seeded = await seed500PastWeekNews(authToken, selectedSheetId);
      
      // Reload sheet attributes
      const info = await fetchSpreadsheetInfo(authToken, selectedSheetId);
      setSheetInfo(info);
      if (seeded.length > 0) {
        setSelectedDate(seeded[0]); // Select newest date
        setApiNotice(`Successfully populated 7 tabs with 500+ highly diverse, pre-categorized news stories in your active Google Sheet!`);
      } else {
        throw new Error("Failed to populate any sheet tabs.");
      }
    } catch (err: any) {
      console.error(err);
      setErrorStatus(err.message || 'Error occurred during 1-week bulk seeder.');
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

  // Compute navigation metrics & lists on the selected card
  const breadcrumbs = useMemo(() => {
    if (!activeItem) return [];
    return getBreadcrumbs(activeItem, newsItems);
  }, [activeItem, newsItems]);

  const levelNodes = useMemo(() => {
    if (!activeItem) return [];
    if (activeItem.level === 'Stock') {
      // Find other stocks that share the same CapGroup!
      return newsItems.filter(x => x.level === 'Stock' && x.capGroup === activeItem.capGroup);
    }
    return newsItems.filter(x => x.level === activeItem.level);
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
        return newsItems.some(x => x.level === 'Stock' && x.capGroup === 'Mid');
      }
      if (activeItem.capGroup === 'Mid') {
        return newsItems.some(x => x.level === 'Stock' && x.capGroup === 'Small');
      }
      return false; // Small cap is bottom
    }
    if (childNodes.length > 0) return true;
    const currentIndex = HIERARCHY_ORDER.indexOf(activeItem.level);
    if (currentIndex < HIERARCHY_ORDER.length - 1) {
      const nextLevel = HIERARCHY_ORDER[currentIndex + 1];
      return newsItems.some(x => x.level === nextLevel);
    }
    return false;
  }, [activeItem, childNodes, newsItems]);

  const hasAboveLevel = useMemo(() => {
    if (!activeItem) return false;
    if (activeItem.level === 'Stock') {
      if (activeItem.capGroup === 'Small') {
        return newsItems.some(x => x.level === 'Stock' && x.capGroup === 'Mid');
      }
      if (activeItem.capGroup === 'Mid') {
        return newsItems.some(x => x.level === 'Stock' && x.capGroup === 'Large');
      }
      // Large cap goes to Parent (Industry level - NIFTYITBEES / IT services)
      return !!parentNode || newsItems.some(x => x.level === 'Industry');
    }
    if (parentNode) return true;
    const currentIndex = HIERARCHY_ORDER.indexOf(activeItem.level);
    if (currentIndex > 0) {
      const prevLevel = HIERARCHY_ORDER[currentIndex - 1];
      return newsItems.some(x => x.level === prevLevel);
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
        const midStocks = newsItems.filter(x => x.level === 'Stock' && x.capGroup === 'Mid');
        if (midStocks.length > 0) {
          setActiveNewsId(midStocks[0].id);
          return;
        }
      } else if (activeItem.capGroup === 'Mid') {
        const smallStocks = newsItems.filter(x => x.level === 'Stock' && x.capGroup === 'Small');
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

    // 2. Fallback: Find general adjacent next level down
    const currentIndex = HIERARCHY_ORDER.indexOf(activeItem.level);
    if (currentIndex < HIERARCHY_ORDER.length - 1) {
      const nextLevel = HIERARCHY_ORDER[currentIndex + 1];
      const itemsAtNextLevel = newsItems.filter(x => x.level === nextLevel);
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
        const midStocks = newsItems.filter(x => x.level === 'Stock' && x.capGroup === 'Mid');
        if (midStocks.length > 0) {
          setActiveNewsId(midStocks[0].id);
          return;
        }
      } else if (activeItem.capGroup === 'Mid') {
        const largeStocks = newsItems.filter(x => x.level === 'Stock' && x.capGroup === 'Large');
        if (largeStocks.length > 0) {
          setActiveNewsId(largeStocks[0].id);
          return;
        }
      } else if (activeItem.capGroup === 'Large') {
        if (parentNode) {
          setActiveNewsId(parentNode.id);
          return;
        }
        const indItems = newsItems.filter(x => x.level === 'Industry');
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

    // 2. Fallback: Find general adjacent previous level up
    const currentIndex = HIERARCHY_ORDER.indexOf(activeItem.level);
    if (currentIndex > 0) {
      const prevLevel = HIERARCHY_ORDER[currentIndex - 1];
      const itemsAtPrevLevel = newsItems.filter(x => x.level === prevLevel);
      if (itemsAtPrevLevel.length > 0) {
        setActiveNewsId(itemsAtPrevLevel[0].id);
      }
    }
  }, [activeItem, parentNode, newsItems]);

  // Keybinding navigation support (Up/Down/Left/Right/PageUp/PageDown)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Ignore key events inside inputs/textareas to prevent collision
      const tag = (e.target as HTMLElement).tagName.toUpperCase();
      if (tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT') return;

      switch (e.key) {
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
  }, [handleScrollUp, handleScrollDown, handleGoDeeper, handleGoAbove]);

  // UI rendering helper
  if (isAuthLoading) {
    return (
      <div className="min-h-screen bg-[#FCFAF7] flex flex-col items-center justify-center text-stone-600">
        <Loader2 className="w-10 h-10 animate-spin text-red-700 mb-4" />
        <p className="text-xs uppercase font-extrabold tracking-widest font-mono">Loading Workspace Authentication...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#FDFCFB] text-[#1A1A1A] font-sans antialiased flex flex-col justify-between">
      {/* Top Navigation Bar */}
      <header className="border-b border-stone-200 bg-white sticky top-0 z-50 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 bg-red-50 border border-red-200 rounded flex items-center justify-center">
              <Sparkles className="w-5 h-5 text-red-700" />
            </div>
            <div>
              <h1 className="text-xs uppercase font-extrabold tracking-[0.1em] text-stone-900 leading-none">Daily News Hierarchy</h1>
              <p className="text-[9px] text-stone-500 font-mono mt-1 leading-none">Structured Inshorts Maps</p>
            </div>
          </div>

          <div className="flex items-center gap-3">

            {/* Settings shortcut button */}
            <button
              onClick={() => setIsSettingsOpen(true)}
              className="p-1 px-2.5 h-8 text-stone-600 hover:text-stone-900 bg-white hover:bg-stone-50 rounded border border-stone-250 transition-all cursor-pointer flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider shadow-sm"
              title="Tune Range & Settings"
            >
              <Settings className="w-3.5 h-3.5" />
              <span>Settings</span>
            </button>

            {/* Sandbox indicator */}
            {isSandboxMode && (
              <span className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1 rounded bg-stone-100 text-stone-850 border border-stone-300 text-[9px] font-bold uppercase tracking-wider font-mono">
                <Bookmark className="w-3 h-3 text-red-700" /> Sandbox Mode
              </span>
            )}

            {/* User credentials / Auth Action */}
            {currentUser ? (
              <div className="flex items-center gap-3">
                <div className="hidden md:flex flex-col items-end">
                  <span className="text-xs font-bold text-stone-900 leading-none">{currentUser.displayName}</span>
                  <span className="text-[9px] text-stone-500 font-mono mt-0.5 leading-none">{currentUser.email}</span>
                </div>
                {currentUser.photoURL && (
                  <img
                    src={currentUser.photoURL}
                    alt={currentUser.displayName || ''}
                    className="w-8 h-8 rounded border border-stone-200"
                    referrerPolicy="no-referrer"
                  />
                )}
                <button
                  onClick={handleSignOut}
                  className="p-1.5 text-stone-500 hover:text-stone-900 hover:bg-stone-100 rounded border border-stone-200 transition-all cursor-pointer"
                  title="Sign out of Google"
                >
                  <LogOut className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <div className="flex items-center gap-2">
                {!isSandboxMode && (
                  <button
                    onClick={handleStartSandbox}
                    className="text-[10px] font-bold text-stone-600 hover:text-stone-950 uppercase tracking-widest px-3 py-1.5 rounded border border-stone-300 hover:bg-stone-50 transition-all cursor-pointer"
                  >
                    Quick Sandbox
                  </button>
                )}
                <button
                  onClick={handleSignIn}
                  className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded bg-stone-900 hover:bg-stone-800 text-white text-[10px] font-extrabold uppercase tracking-wider transition-all shadow-sm border border-black cursor-pointer"
                >
                  <FileSpreadsheet className="w-3.5 h-3.5" />
                  <span>Connect Sheets</span>
                </button>
              </div>
            )}
          </div>
        </div>
      </header>

      {/* Simulator Console for sandbox & profile evaluations */}
      <div className="bg-amber-50/50 border-b border-amber-250 py-2.5 px-4 text-xs text-stone-800">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-3">
          <div className="flex flex-col sm:flex-row sm:items-center gap-2 text-center sm:text-left">
            <span className="text-[9px] font-sans font-black uppercase tracking-widest bg-amber-600/10 text-amber-800 px-2 py-0.5 rounded border border-amber-500/20 inline-block mx-auto sm:mx-0">
              User Switcher Console
            </span>
            <span className="font-serif italic text-[11px] text-stone-600 block">
              Simulate role profiles to review the Admin vs Reader experience:
            </span>
          </div>
          <div className="flex flex-wrap items-center justify-center gap-2">
            <button
              onClick={() => {
                setCurrentUser(null);
                setAuthToken(null);
                setIsAdminMode(false);
              }}
              className={`px-3 py-1 text-[10px] uppercase tracking-wider font-mono font-extrabold rounded border transition-all cursor-pointer ${
                !currentUser
                  ? 'bg-stone-900 border-stone-900 text-white shadow-sm'
                  : 'bg-white border-stone-250 text-stone-600 hover:bg-stone-50 hover:text-stone-900'
              }`}
              title="No simulated credentials. Displays the welcome page."
            >
              No User (Guest)
            </button>
            <button
              onClick={() => {
                const dummyReader = {
                  displayName: 'Alex Mercer (Reader)',
                  email: 'alex.mercer@gmail.com',
                  photoURL: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=150'
                };
                setCurrentUser(dummyReader);
                setAuthToken('dummy_reader_token');
                setIsAdminMode(false);
                if (!isSandboxMode && !selectedSheetId) {
                  handleStartSandbox();
                }
              }}
              className={`px-3 py-1 text-[10px] uppercase tracking-wider font-mono font-extrabold rounded border transition-all cursor-pointer ${
                currentUser && currentUser.email === 'alex.mercer@gmail.com'
                  ? 'bg-stone-900 border-stone-900 text-white shadow-sm'
                  : 'bg-white border-stone-250 text-stone-600 hover:bg-stone-50 hover:text-stone-900'
              }`}
              title="Normal reader simulation. Restricts admin settings."
            >
              Dummy Reader (Alex)
            </button>
            <button
              onClick={() => {
                const dummyAdmin = {
                  displayName: 'Saurabh (Admin)',
                  email: 'saurabhsks01@gmail.com',
                  photoURL: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?auto=format&fit=crop&w=150'
                };
                setCurrentUser(dummyAdmin);
                setAuthToken('dummy_admin_token');
                setIsAdminMode(true);
                if (!isSandboxMode && !selectedSheetId) {
                  handleStartSandbox();
                }
              }}
              className={`px-3 py-1 text-[10px] uppercase tracking-wider font-mono font-extrabold rounded border transition-all cursor-pointer ${
                currentUser && currentUser.email === 'saurabhsks01@gmail.com'
                  ? 'bg-red-700 border-red-800 text-white shadow-sm'
                  : 'bg-white border-stone-250 text-stone-600 hover:bg-stone-50 hover:text-red-700'
              }`}
              title="Admin user simulation. Activates advanced harvester seeder configurations."
            >
              Admin Selector (Saurabh)
            </button>
          </div>
        </div>
      </div>

      {/* Main App Layout */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-4 sm:p-6 lg:p-8 flex flex-col gap-6">
        {/* Onboarding View: If not logged-in, not sandbox, and no default sheet id exists, present premium cover setup */}
        {!currentUser && !isSandboxMode && !selectedSheetId ? (
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
                  className="w-full sm:w-auto px-6 py-3.5 rounded bg-red-700 hover:bg-red-800 text-white font-extrabold uppercase tracking-wider text-xs transition-all shadow-md cursor-pointer flex items-center justify-center gap-2 border border-red-900"
                >
                  <FileSpreadsheet className="w-4 h-4" /> Link Google Sheet Workspace
                </button>
                <button
                  onClick={handleStartSandbox}
                  className="w-full sm:w-auto px-6 py-3.5 rounded bg-white border border-stone-300 hover:bg-stone-50 text-stone-900 font-extrabold uppercase tracking-wider text-xs transition-all cursor-pointer flex items-center justify-center gap-2"
                >
                  <BookOpen className="w-4 h-4 text-red-700" /> Open Instant Sandbox
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
        ) : currentUser && !isSandboxMode && !selectedSheetId ? (
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
                  className="flex-1 px-5 py-3.5 bg-red-700 hover:bg-red-800 text-white text-xs font-bold uppercase tracking-wider rounded-lg border border-red-900 transition-all cursor-pointer flex items-center justify-center gap-2 disabled:opacity-50 font-sans"
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
                <button
                  onClick={handleStartSandbox}
                  className="px-4 py-3.5 bg-white border border-stone-300 hover:bg-stone-50 text-stone-850 text-xs font-bold uppercase tracking-wider rounded-lg transition-all cursor-pointer font-sans"
                >
                  Or Open Sandbox
                </button>
              </div>

              <p className="text-[10px] text-stone-500 font-serif">
                You can also link any existing spreadsheets directly inside Settings or evaluate simulated profiles in the switcher console.
              </p>
            </motion.div>
          </div>
        ) : (
          <div className="space-y-6">
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

            {/* Subtle notice for the active date and settings */}
            <div className="max-w-2xl mx-auto w-full text-center text-[10px] text-stone-600 font-mono flex flex-wrap items-center justify-center gap-2 border border-stone-200 bg-[#FCFAF7] p-2.5 rounded-xl shadow-xs">
              <Calendar className="w-3.5 h-3.5 text-red-700" />
              <span>
                ACTIVE WS EDITION:{' '}
                <strong className="text-stone-900 font-semibold font-sans">
                  {isSandboxMode ? sandboxActiveDate : selectedDate || 'No Sheet Connected'}
                </strong>{' '}
                <span className="text-stone-400">({dateRange === '1day' ? '1 Day Summary' : dateRange === '1week' ? '1 Week Merged' : dateRange === '1month' ? '1 Month Merged' : '1 Quarter Merged'})</span>
              </span>
              <span className="text-stone-300 hidden sm:inline">|</span>
              <button
                onClick={() => setIsSettingsOpen(true)}
                className="text-red-700 hover:text-red-800 font-extrabold uppercase hover:underline cursor-pointer text-[10px]"
              >
                Change Date & Tune Horizon
              </button>
            </div>

            {/* Main Interactive Workspace splitting Layout */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-stretch min-h-[620px]">
              
              {/* Left Column: Classic Gesture-based Inshorts News Deck */}
              <div className={isMindMapVisible ? "lg:col-span-5 flex flex-col justify-start" : "lg:col-span-12 max-w-2xl mx-auto w-full flex flex-col justify-start"}>
                <div className="flex flex-col sm:flex-row items-center justify-between gap-2 mb-4 px-1.5">
                  <div className="text-center sm:text-left">
                    <span className="text-[10px] font-mono font-bold text-stone-500 uppercase tracking-widest block mb-0.5">
                      Editorial News Deck
                    </span>
                    <p className="text-[11px] text-stone-600 font-serif italic">
                      Scroll up/down for siblings & vertical depth
                    </p>
                  </div>
                  
                  {/* Floating unread progress meter in the top-right */}
                  {activeItem && (
                    <div className="flex items-center gap-1.5 bg-stone-100 border border-stone-200 px-2.5 py-1 rounded-full text-[10px] font-mono shadow-2xs select-none">
                      <span className="w-1.5 h-1.5 rounded-full bg-red-700 animate-pulse shrink-0" />
                      <span className="text-stone-500 font-medium">Unread at this path:</span>
                      <strong className="text-stone-900 font-extrabold">{activeBranchUnreadCount}/{activeBranchTotalCount}</strong>
                      <button
                        onClick={() => {
                          const empty = {};
                          setReadNewsIds(empty);
                          localStorage.setItem('read_news_ids_v1', JSON.stringify(empty));
                        }}
                        className="ml-1 hover:text-red-700 text-[9px] uppercase font-bold text-stone-400 cursor-pointer"
                        title="Reset reading history log"
                      >
                        Reset
                      </button>
                    </div>
                  )}
                </div>

                <div className="flex-1 min-h-[580px] flex items-center justify-center relative">
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
                    <div className="text-center text-stone-600 border border-dashed border-stone-300 p-8 rounded-xl w-full max-w-md my-auto h-[400px] flex flex-col items-center justify-center bg-[#FCFAF7]">
                      <Database className="w-10 h-10 text-stone-400 mb-3" />
                      <p className="text-sm font-semibold font-serif mb-1">No News stories mapped</p>
                      <p className="text-xs text-stone-500 max-w-xs mx-auto font-serif italic">
                        This date tab currently has no news cards. Deploy global news summaries via the AI news Portal harvester above!
                      </p>
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
              className={`bg-[#FCFAF7] border border-stone-300 rounded-2xl p-6 shadow-2xl w-full text-stone-900 relative font-sans my-8 transition-all ${
                isActuallyAdmin ? 'max-w-2xl text-left' : 'max-w-lg text-left'
              }`}
            >
              {/* Close Button */}
              <button
                onClick={() => setIsSettingsOpen(false)}
                className="absolute top-4 right-4 p-1.5 rounded-lg border border-stone-200 text-stone-500 hover:text-stone-900 hover:bg-stone-100 transition-all cursor-pointer bg-white"
                title="Close settings"
              >
                <X className="w-4 h-4" />
              </button>

              {/* Title Section */}
              <div className="flex items-center gap-2.5 mb-5 pb-3 border-b border-stone-200">
                <Settings className="w-5 h-5 text-red-700" />
                <div>
                  <h3 className="text-xs uppercase font-extrabold tracking-widest text-stone-900">Application Workspace & Preferences</h3>
                  <p className="text-[10px] text-stone-600 font-mono">Fine-tune dynamic temporal horizons & database triggers</p>
                </div>
              </div>

              {/* Preferences Settings (Visible to All Users) */}
              <div className="space-y-4">
                
                {/* 1. Range Dial Selector */}
                <div className="bg-white border border-stone-200 p-4 rounded-xl shadow-xs">
                  <div className="text-left mb-3">
                    <span className="text-[10px] font-mono font-extrabold text-stone-500 uppercase tracking-widest block">
                      Timeline Range Tuner Dial
                    </span>
                    <p className="text-[10px] text-stone-500 font-serif italic mt-0.5">
                      Tune the range left or right to merge, filter or expand the temporal horizon of your timeline
                    </p>
                  </div>
                  
                  <div className="flex items-center gap-2 w-full justify-center">
                    {/* Tune Left */}
                    <button
                      onClick={() => {
                        const ranges: ('1day' | '1week' | '1month' | '1quarter')[] = ['1day', '1week', '1month', '1quarter'];
                        const idx = ranges.indexOf(dateRange);
                        if (idx > 0) {
                          setDateRange(ranges[idx - 1]);
                        }
                      }}
                      disabled={dateRange === '1day'}
                      className="p-1.5 rounded-lg border border-stone-300 hover:bg-stone-55 disabled:opacity-30 disabled:hover:bg-transparent text-stone-800 disabled:text-stone-400 transition-all cursor-pointer bg-white flex items-center justify-center font-bold"
                      title="Tune Range Left (Reduce)"
                    >
                      <ChevronLeft className="w-4 h-4" />
                    </button>

                    {/* Range indicators bar */}
                    <div className="flex-1 flex items-center bg-stone-100 border border-stone-200 p-1 rounded-lg gap-1">
                      {(['1day', '1week', '1month', '1quarter'] as const).map((r) => {
                        const isActive = dateRange === r;
                        const labels = { '1day': '1 Day', '1week': '1 Week', '1month': '1 Month', '1quarter': '1 Qtr' };
                        return (
                          <button
                            key={r}
                            onClick={() => setDateRange(r)}
                            className={`flex-1 text-center py-1 rounded text-[10px] font-extrabold uppercase tracking-wider transition-all cursor-pointer ${
                              isActive
                                ? 'bg-red-700 text-white shadow-sm border border-red-805 font-bold'
                                : 'text-stone-605 hover:text-stone-900 hover:bg-stone-250 font-medium'
                            }`}
                          >
                            {labels[r]}
                          </button>
                        );
                      })}
                    </div>

                    {/* Tune Right */}
                    <button
                      onClick={() => {
                        const ranges: ('1day' | '1week' | '1month' | '1quarter')[] = ['1day', '1week', '1month', '1quarter'];
                        const idx = ranges.indexOf(dateRange);
                        if (idx < ranges.length - 1) {
                          setDateRange(ranges[idx + 1]);
                        }
                      }}
                      disabled={dateRange === '1quarter'}
                      className="p-1.5 rounded-lg border border-stone-300 hover:bg-stone-55 disabled:opacity-30 disabled:hover:bg-transparent text-stone-800 disabled:text-stone-400 transition-all cursor-pointer bg-white flex items-center justify-center font-bold"
                      title="Tune Range Right (Increase)"
                    >
                      <ChevronRight className="w-4 h-4" />
                    </button>
                  </div>
                  
                  <p className="text-[10px] text-stone-500 font-serif italic mt-2.5 text-center border-t border-stone-100 pt-2">
                    Active span: <strong className="font-sans font-extrabold text-stone-850 uppercase tracking-wide not-italic text-[10px]">
                      {dateRange === '1day' && '1 Day Summary (Selected Date Tab Only)'}
                      {dateRange === '1week' && '1 Week Merged Timeline (Last 7 Days)'}
                      {dateRange === '1month' && '1 Month Aggregated Map (Last 30 Days)'}
                      {dateRange === '1quarter' && '1 Quarter Macro View (Last 90 Days)'}
                    </strong>
                  </p>
                </div>

                {/* 2. Interactive Mindmap Display Toggle */}
                <div className="bg-white border border-stone-200 p-4 rounded-xl shadow-xs">
                  <div className="flex items-center justify-between">
                    <div className="text-left pr-2">
                      <span className="text-[10px] font-mono font-extrabold text-stone-500 uppercase tracking-widest block">
                        Display Mindmap Diagram
                      </span>
                      <p className="text-[10px] text-stone-500 font-serif italic mt-0.5">
                        Toggle the structural tree graph right next to your Editorial news deck
                      </p>
                    </div>
                    <button
                      onClick={() => setIsMindMapVisible(!isMindMapVisible)}
                      className={`h-8 px-3 rounded-lg border text-[10px] font-extrabold uppercase tracking-wider transition-all cursor-pointer shrink-0 ${
                        isMindMapVisible
                          ? 'bg-red-700 text-white border-red-800 shadow-sm font-semibold'
                          : 'bg-white text-stone-705 border-stone-300 hover:bg-stone-50 font-normal'
                      }`}
                    >
                      {isMindMapVisible ? 'ON (Visible)' : 'OFF (Hidden)'}
                    </button>
                  </div>
                </div>

                {/* 3. Choose Active Date Edition */}
                <div className="bg-white border border-stone-200 p-4 rounded-xl shadow-xs">
                  <div className="flex items-center justify-between">
                    <div className="text-left pr-2">
                      <span className="text-[10px] font-mono font-extrabold text-stone-500 uppercase tracking-widest block">
                        Choose Active Date Edition
                      </span>
                      <p className="text-[10px] text-stone-500 font-serif italic mt-0.5">
                        Browse pre-categorized news editions loaded for particular days
                      </p>
                    </div>

                    <div className="shrink-0 flex items-center gap-2">
                      {isSandboxMode ? (
                        <select
                          value={sandboxActiveDate}
                          onChange={(e) => setSandboxActiveDate(e.target.value)}
                          className="bg-white border border-stone-300 rounded-md px-2 py-1 text-[11px] font-extrabold text-stone-900 focus:outline-none focus:ring-1 focus:ring-red-700 cursor-pointer shadow-sm font-sans h-8"
                        >
                          {sandboxDates.map((tab) => (
                            <option key={tab} value={tab}>
                              {tab}
                            </option>
                          ))}
                        </select>
                      ) : sheetInfo && sheetInfo.tabs && sheetInfo.tabs.length > 0 ? (
                        <select
                          value={selectedDate}
                          onChange={(e) => setSelectedDate(e.target.value)}
                          className="bg-white border border-stone-300 rounded-md px-2 py-1 text-[11px] font-extrabold text-stone-900 focus:outline-none focus:ring-1 focus:ring-red-700 cursor-pointer shadow-sm font-sans h-8"
                        >
                          {sheetInfo.tabs.map((tab) => (
                            <option key={tab} value={tab}>
                              {tab}
                            </option>
                          ))}
                        </select>
                      ) : (
                        <span className="text-[10px] font-mono text-stone-400 uppercase">No Tabs Synced</span>
                      )}
                    </div>
                  </div>
                </div>

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
                          Automated background tasks parse portals and calculate stock impacts, appending updates hourly.
                        </p>
                        <button
                          onClick={handleLoadAIPortalNews}
                          disabled={isAiLoading || (!isSandboxMode && (!selectedSheetId || !selectedDate))}
                          className="w-full inline-flex items-center justify-center gap-1.5 px-3 py-1.5 bg-stone-900 hover:bg-stone-850 disabled:bg-stone-100 disabled:text-stone-400 text-white text-[9px] font-bold uppercase tracking-wider rounded border border-black cursor-pointer shadow-2xs"
                        >
                          {isAiLoading ? (
                            <>
                              <Loader2 className="w-3 h-3 animate-spin" />
                              <span>Refreshing Sheet...</span>
                            </>
                          ) : (
                            <>
                              <Database className="w-3 h-3 text-red-700" />
                              <span>Database Refresh (Fetch)</span>
                            </>
                          )}
                        </button>
                      </div>

                      {/* Seeding section */}
                      <div className="bg-white p-3 rounded-lg border border-stone-200 shadow-2xs space-y-2">
                        <span className="text-[9px] font-mono font-bold text-stone-500 uppercase block">BULK HISTORICAL SEEDER</span>
                        <p className="text-[10px] text-stone-605 font-serif leading-tight">
                          Refresh and seed Google Sheet database with <strong>500 news stories</strong> spanning the last 1 week (over 70 news/day).
                        </p>
                        <button
                          onClick={handleBulkSeedPastWeek}
                          disabled={isSyncing || loadingSheets}
                          className="w-full inline-flex items-center justify-center gap-1.5 px-3 py-1.5 bg-red-700 hover:bg-red-800 disabled:opacity-40 text-white text-[9px] font-bold uppercase tracking-wider rounded border border-red-800 cursor-pointer shadow-sm transform active:scale-95 transition-all"
                        >
                          {isSyncing ? (
                            <>
                              <Loader2 className="w-3 h-3 animate-spin" />
                              <span>Seeding 500 News Items...</span>
                            </>
                          ) : (
                            <>
                              <Sparkles className="w-3.5 h-3.5 animate-bounce text-stone-200" />
                              <span>Seed 1-Week (500+ News)</span>
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
                ) : (
                  <div className="bg-stone-100 border border-stone-200 p-4 rounded-xl mt-3 flex items-center gap-3">
                    <Info className="w-4 h-4 text-stone-500 shrink-0 animate-pulse" />
                    <div className="text-left">
                      <span className="text-[9px] font-mono font-bold text-stone-500 uppercase">RESTRICTED CONFIG</span>
                      <p className="text-[10px] text-stone-600 font-serif leading-tight">
                        Database synchronization metrics, automatic harvester checkers, and live spreadsheet inspect grids are hidden since you are logged in as a normal reader. Switch to **Admin Mode** in the header above to test administrator features.
                      </p>
                    </div>
                  </div>
                )}

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

      {/* Aesthetic Footer */}
      <footer className="border-t border-stone-200 bg-stone-50 py-8 mt-12 text-center text-stone-500 text-xs font-serif italic">
        <div className="max-w-7xl mx-auto px-4">
          <p>© 2026 Daily Hierarchical News Reader. Fully persistable structure utilizing Google Sheets.</p>
          <p className="text-[10px] text-stone-400 font-mono mt-1 not-italic">
            Built using Google AI Studio Build Runtime & Firebase OAuth
          </p>
        </div>
      </footer>
    </div>
  );
}
