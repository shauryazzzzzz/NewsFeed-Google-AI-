import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import { createRequire } from 'module';
import { createServer as createViteServer } from 'vite';
import { GoogleGenAI, Type } from '@google/genai';
import dotenv from 'dotenv';
import Parser from 'rss-parser';

// ── Key loading (highest priority first) ──────────────────────────────────────
// 1. Real process.env  2. .env.local (Gemini key, PORT)  3. commons/secrets.env
dotenv.config({ path: '.env.local' });
dotenv.config(); // also load .env if present
// Load workspace commons/secrets.env for WATSONX_* fallback (sets keys not yet set)
const _req = createRequire(import.meta.url);
const __dirname = path.dirname(fileURLToPath(import.meta.url));
try {
  const { loadSharedEnv } = _req(path.join(__dirname, '..', 'commons', 'load-env.js'));
  loadSharedEnv();
} catch { /* commons/secrets.env not present — project-local .env.local keys used */ }

// WatsonX helper — inline (no module dependency needed, shared logic)
// Keys now sourced from commons/secrets.env → see CREDENTIALS_REFERENCE.md
async function watsonxAskAI(prompt: string, opts: { maxTokens?: number; temperature?: number } = {}): Promise<{ text: string; provider: string }> {
  const KEY = process.env.WATSONX_API_KEY; const PID = process.env.WATSONX_PROJECT_ID;
  const REGION = process.env.WATSONX_REGION || 'us-south'; const MODEL = process.env.WATSONX_TEXT_MODEL || 'ibm/granite-4-h-small';
  if (!KEY || !PID) return { text: '', provider: 'none' };
  const iamR = await fetch('https://iam.cloud.ibm.com/identity/token', { method:'POST', headers:{'Content-Type':'application/x-www-form-urlencoded'}, body:`grant_type=urn:ibm:params:oauth:grant-type:apikey&apikey=${encodeURIComponent(KEY)}` });
  if (!iamR.ok) return { text: '', provider: 'none' };
  const { access_token } = await iamR.json();
  const r = await fetch(`https://${REGION}.ml.cloud.ibm.com/ml/v1/text/generation?version=2023-05-29`, { method:'POST', headers:{'Content-Type':'application/json','Authorization':`Bearer ${access_token}`}, body: JSON.stringify({ model_id: MODEL, input: prompt, parameters: { max_new_tokens: opts.maxTokens||400, temperature: opts.temperature??0.3 }, project_id: PID }) });
  if (!r.ok) return { text: '', provider: 'none' };
  const d = await r.json(); return { text: d.results?.[0]?.generated_text?.trim()||'', provider: 'watsonx' };
}

// ─── WatsonX news generation (IBM-first per GLOBAL_RULES §1) ─────────────────
async function generateNewsWithWatsonx(targetDate: string): Promise<any[] | null> {
  const WATSONX_KEY = process.env.WATSONX_API_KEY;
  const WATSONX_PID = process.env.WATSONX_PROJECT_ID;
  if (!WATSONX_KEY || !WATSONX_PID) return null;
  try {
    const prompt = `date=${targetDate} task=generate-news-hierarchy\nGenerate 13 news items as JSON array with fields: id,level,parentId,categoryName,title,summary,source,link,imageUrl,changePercent,benchmarkLabel\nLevels: Global(1) Geography(2) Country(2) Sector(2) Industry(2) Stock(4)\nReply ONLY with valid JSON array.`;
    const result = await watsonxAskAI(prompt, { maxTokens: 800, temperature: 0.3 });
    if (!result.text || result.provider === 'dummy') return null;
    const parsed = JSON.parse(result.text.replace(/```json|```/g,'').trim());
    return Array.isArray(parsed) && parsed.length >= 5 ? parsed : null;
  } catch { return null; }
}

const rssParser = new Parser();

async function startServer() {
  const app = express();
  const PORT = parseInt(process.env.PORT || '3002', 10);

  // Set up JSON encoding limit for heavy generation
  app.use(express.json({ limit: '10mb' }));

  // API Config endpoint to return configuration settings
  app.get('/api/config', (req, res) => {
    res.json({
      selectedSheetId: process.env.DEFAULT_SPREADSHEET_ID || 'e/2PACX-1vSesHAf2i4cSydOiMSszcwC1sRz7yh6tiyVSQqbgAtnczqjqlwNhuw4nM-yjCeYL4OHNQkUq1y2K0t6'
    });
  });

  // Simple clean state-machine CSV parser for fetching Google Sheets rows without dependencies
  function parseCSV(csvText: string): string[][] {
    const lines: string[][] = [];
    let row: string[] = [];
    let inQuotes = false;
    let currentValue = '';

    for (let i = 0; i < csvText.length; i++) {
      const char = csvText[i];
      const nextChar = csvText[i + 1];

      if (char === '"') {
        if (inQuotes && nextChar === '"') {
          currentValue += '"';
          i++; // skip next quote
        } else {
          inQuotes = !inQuotes;
        }
      } else if (char === ',' && !inQuotes) {
        row.push(currentValue);
        currentValue = '';
      } else if ((char === '\r' || char === '\n') && !inQuotes) {
        if (char === '\r' && nextChar === '\n') {
          i++;
        }
        row.push(currentValue);
        lines.push(row);
        row = [];
        currentValue = '';
      } else {
        currentValue += char;
      }
    }
    if (currentValue || row.length > 0) {
      row.push(currentValue);
      lines.push(row);
    }
    return lines;
  }

  const LIVE_NEWS_RSS_SOURCES = [
    { source: 'Google News India', url: 'https://news.google.com/rss?hl=en-IN&gl=IN&ceid=IN:en' },
    { source: 'Google News World', url: 'https://news.google.com/rss?hl=en-US&gl=US&ceid=US:en' },
    { source: 'Moneycontrol', url: 'https://www.moneycontrol.com/rss/latestnews.xml' },
    { source: 'Reuters World', url: 'https://feeds.reuters.com/reuters/worldNews' },
    { source: 'Reuters Business', url: 'https://feeds.reuters.com/reuters/businessNews' },
    { source: 'BBC Business', url: 'https://feeds.bbci.co.uk/news/business/rss.xml' },
    { source: 'NDTV Profit', url: 'https://feeds.feedburner.com/ndtvprofit-latest' }
  ];

  const LIVE_NEWS_IMAGES = [
    'https://images.unsplash.com/photo-1502920514313-52581002a659?auto=format&fit=crop&w=800&q=80',
    'https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?auto=format&fit=crop&w=800&q=80',
    'https://images.unsplash.com/photo-1516321318423-f06f85e504b3?auto=format&fit=crop&w=800&q=80',
    'https://images.unsplash.com/photo-1451187580459-43490279c0fa?auto=format&fit=crop&w=800&q=80'
  ];

  const cleanText = (value?: string | null) => (value || '').replace(/\s+/g, ' ').trim();

  const inferCategoryLabel = (title: string, level: string) => {
    const lower = title.toLowerCase();

    if (level === 'Global') return 'Global Macro';

    if (level === 'Geography') {
      if (/india|mumbai|bharat|nifty|sensex|modi/.test(lower)) return 'India';
      if (/us|usa|wall street|nasdaq|fed|treasury|s&p|dow jones|america/.test(lower)) return 'United States';
      if (/china|beijing|shanghai|hong kong|apac|asia/.test(lower)) return 'Asia-Pacific';
      if (/europe|germany|uk|france|eu|euro|london/.test(lower)) return 'Europe';
      if (/middle east|uae|saudi|dubai|gulf|qatar|oman/.test(lower)) return 'Middle East & Africa';
      return 'Global Markets';
    }

    if (level === 'Country') {
      if (/india|mumbai|bharat|nifty|sensex|modi/.test(lower)) return 'India';
      if (/us|usa|wall street|nasdaq|fed|treasury|s&p|dow jones|america/.test(lower)) return 'United States';
      if (/china|beijing|shanghai|hong kong|apac|asia/.test(lower)) return 'China';
      if (/europe|germany|uk|france|eu|euro|london/.test(lower)) return 'Europe';
      if (/japan|tokyo|korea|taiwan|south korea/.test(lower)) return 'East Asia';
      return 'Market Country';
    }

    if (/health|pharma|biotech|hospital|vaccine|medical|drug/.test(lower)) return 'Healthcare & Pharma';
    if (/auto|ev|electric vehicle|battery|car|tesla|motor|maruti|hyundai/.test(lower)) return 'Automotive & EV';
    if (/energy|oil|gas|power|grid|coal|renewable|utility|solar|wind|hydrogen/.test(lower)) return 'Energy & Utilities';
    if (/real estate|property|housing|home|mortgage|builder|construction/.test(lower)) return 'Real Estate & Construction';
    if (/bank|finance|credit|loan|rbi|yield|deficit|inflation|rate|economy|market|equity|stock/.test(lower)) return 'Financial Markets';
    if (/retail|consumer|fmcg|food|grocery|warehouse|fashion|ecommerce/.test(lower)) return 'Consumer & Retail';
    if (/telecom|5g|network|mobile|media|broadcast|satellite/.test(lower)) return 'Telecom & Media';
    if (/agri|farm|crop|wheat|rice|food grain|fertilizer|sugar/.test(lower)) return 'Agriculture & Food';
    if (/steel|cement|industrial|infrastructure|logistics|transport|shipping|mining/.test(lower)) return 'Industrials & Infrastructure';
    if (/chip|semiconductor|gpu|ai|software|cloud|tech|cyber|data|startup|cloud/.test(lower)) return 'Technology & AI';
    if (/airline|travel|tourism/.test(lower)) return 'Travel & Tourism';

    return level === 'Stock' ? 'Market Leader' : level === 'Industry' ? 'Core Industry' : 'Live News';
  };

  async function fetchLiveNewsTree(dateStr: string) {
    const feedResults = await Promise.allSettled(
      LIVE_NEWS_RSS_SOURCES.map(async ({ source, url }) => {
        const response = await fetch(url, {
          headers: {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/100.0.0.0 Safari/537.36'
          }
        });

        if (!response.ok) {
          throw new Error(`Failed to fetch ${source} RSS feed: HTTP ${response.status}`);
        }

        const xml = await response.text();
        const feed = await rssParser.parseString(xml);
        return (feed.items || []).slice(0, 8).map(item => ({
          title: cleanText(item.title),
          summary: cleanText(item.contentSnippet || item.summary || item.content),
          link: item.link || item.guid || '#',
          source
        }));
      })
    );

    const liveItems = feedResults
      .filter(result => result.status === 'fulfilled')
      .flatMap(result => result.value)
      .filter(item => item.title && item.link && item.summary);

    feedResults
      .filter(result => result.status === 'rejected')
      .forEach(result => {
        console.warn(`[AI Reader] RSS source skipped: ${result.reason?.message || result.reason}`);
      });

    const dedupedItems = liveItems.filter((item, index, self) => {
      const signature = `${item.title}::${item.link}`;
      return self.findIndex(candidate => `${candidate.title}::${candidate.link}` === signature) === index;
    });

    const fallbackItems = dedupedItems.length > 0 ? dedupedItems : liveItems;
    if (fallbackItems.length === 0) {
      throw new Error('No live RSS headlines could be fetched for the current date.');
    }

    const storyTemplate = [
      { id: 'G_AUTO_1', level: 'Global', parentId: null },
      { id: 'GEO_AUTO_1', level: 'Geography', parentId: 'G_AUTO_1' },
      { id: 'GEO_AUTO_2', level: 'Geography', parentId: 'G_AUTO_1' },
      { id: 'GEO_AUTO_3', level: 'Geography', parentId: 'G_AUTO_1' },
      { id: 'GEO_AUTO_4', level: 'Geography', parentId: 'G_AUTO_1' },
      { id: 'C_AUTO_1', level: 'Country', parentId: 'GEO_AUTO_1' },
      { id: 'C_AUTO_2', level: 'Country', parentId: 'GEO_AUTO_2' },
      { id: 'C_AUTO_3', level: 'Country', parentId: 'GEO_AUTO_3' },
      { id: 'C_AUTO_4', level: 'Country', parentId: 'GEO_AUTO_4' },
      { id: 'S_AUTO_1', level: 'Sector', parentId: 'C_AUTO_1' },
      { id: 'S_AUTO_2', level: 'Sector', parentId: 'C_AUTO_1' },
      { id: 'S_AUTO_3', level: 'Sector', parentId: 'C_AUTO_2' },
      { id: 'S_AUTO_4', level: 'Sector', parentId: 'C_AUTO_2' },
      { id: 'S_AUTO_5', level: 'Sector', parentId: 'C_AUTO_3' },
      { id: 'S_AUTO_6', level: 'Sector', parentId: 'C_AUTO_3' },
      { id: 'S_AUTO_7', level: 'Sector', parentId: 'C_AUTO_4' },
      { id: 'S_AUTO_8', level: 'Sector', parentId: 'C_AUTO_4' },
      { id: 'I_AUTO_1', level: 'Industry', parentId: 'S_AUTO_1' },
      { id: 'I_AUTO_2', level: 'Industry', parentId: 'S_AUTO_2' },
      { id: 'I_AUTO_3', level: 'Industry', parentId: 'S_AUTO_3' },
      { id: 'I_AUTO_4', level: 'Industry', parentId: 'S_AUTO_4' },
      { id: 'I_AUTO_5', level: 'Industry', parentId: 'S_AUTO_5' },
      { id: 'I_AUTO_6', level: 'Industry', parentId: 'S_AUTO_6' },
      { id: 'I_AUTO_7', level: 'Industry', parentId: 'S_AUTO_7' },
      { id: 'I_AUTO_8', level: 'Industry', parentId: 'S_AUTO_8' },
      { id: 'ST_AUTO_1', level: 'Stock', parentId: 'I_AUTO_1' },
      { id: 'ST_AUTO_2', level: 'Stock', parentId: 'I_AUTO_1' },
      { id: 'ST_AUTO_3', level: 'Stock', parentId: 'I_AUTO_2' },
      { id: 'ST_AUTO_4', level: 'Stock', parentId: 'I_AUTO_2' },
      { id: 'ST_AUTO_5', level: 'Stock', parentId: 'I_AUTO_3' },
      { id: 'ST_AUTO_6', level: 'Stock', parentId: 'I_AUTO_3' },
      { id: 'ST_AUTO_7', level: 'Stock', parentId: 'I_AUTO_4' },
      { id: 'ST_AUTO_8', level: 'Stock', parentId: 'I_AUTO_4' },
      { id: 'ST_AUTO_9', level: 'Stock', parentId: 'I_AUTO_5' },
      { id: 'ST_AUTO_10', level: 'Stock', parentId: 'I_AUTO_5' },
      { id: 'ST_AUTO_11', level: 'Stock', parentId: 'I_AUTO_6' },
      { id: 'ST_AUTO_12', level: 'Stock', parentId: 'I_AUTO_6' },
      { id: 'ST_AUTO_13', level: 'Stock', parentId: 'I_AUTO_7' },
      { id: 'ST_AUTO_14', level: 'Stock', parentId: 'I_AUTO_7' },
      { id: 'ST_AUTO_15', level: 'Stock', parentId: 'I_AUTO_8' },
      { id: 'ST_AUTO_16', level: 'Stock', parentId: 'I_AUTO_8' }
    ];

    return storyTemplate.map((template, index) => {
      const item = fallbackItems[index % fallbackItems.length] || fallbackItems[fallbackItems.length - 1];
      const title = item.title;
      const summary = item.summary.length > 360 ? `${item.summary.slice(0, 357)}...` : item.summary;
      return {
        ...template,
        categoryName: inferCategoryLabel(title, template.level),
        title,
        summary: `${summary} (${dateStr})`,
        source: item.source,
        link: item.link,
        imageUrl: LIVE_NEWS_IMAGES[index % LIVE_NEWS_IMAGES.length],
        date: dateStr,
        changePercent: 0,
        benchmarkLabel: template.level === 'Stock' ? 'Live Market' : 'Live Index'
      };
    });
  }

  // Get sheet list (tabs formatted as dates YYYY-MM-DD or other general names) from a public spreadsheet URL
  app.get('/api/public-sheet-info', async (req, res) => {
    const spreadsheetId = req.query.spreadsheetId || 'e/2PACX-1vSesHAf2i4cSydOiMSszcwC1sRz7yh6tiyVSQqbgAtnczqjqlwNhuw4nM-yjCeYL4OHNQkUq1y2K0t6';
    const idStr = String(spreadsheetId);
    const isPublished = idStr.startsWith('e/') || idStr.includes('e/2PACX-') || idStr.includes('2PACX-');

    try {
      const url = isPublished 
        ? `https://docs.google.com/spreadsheets/d/${idStr}/pubhtml` 
        : `https://docs.google.com/spreadsheets/d/${idStr}/htmlview`;
      console.log(`[Public Info Proxy] Loading sheet metadata from URL: ${url} (isPublished: ${isPublished})`);
      
      const response = await fetch(url, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/100.0.0.0 Safari/537.36'
        }
      });
      
      if (!response.ok) {
        throw new Error(`Google Sheets responded with HTTP status ${response.status}`);
      }
      
      const htmlText = await response.text();
      // If the response is a Google login screen redirect, then accessibility is restricted by sharing settings
      if (htmlText.includes('ServiceLogin') || htmlText.includes('accounts.google.com') || htmlText.includes('signup') || htmlText.includes('Google Accounts')) {
        return res.status(403).json({
          success: false,
          error: "Permission Denied: This Google Sheet has restricted settings. To allow the app to view it, click the blue 'Share' button in Google Sheets and select 'Anyone with the link can view' (as a Viewer)."
        });
      }

      const tabsSet = new Set<string>();

      const extractDates = (text: string) => {
        // Date formatted tab strings match pattern: YYYY-MM-DD (2000-2999 years)
        const dateRegex = /\b2\d{3}-\d{2}-\d{2}\b/g;
        let match;
        while ((match = dateRegex.exec(text)) !== null) {
          tabsSet.add(match[0]);
        }

        // Extract published web-app tab structures
        const pubhtmlTabRegex = /<li[^>]*sheet-button[^>]*><a[^>]*>([^<]+)<\/a>/g;
        let pubhtmlMatch;
        while ((pubhtmlMatch = pubhtmlTabRegex.exec(text)) !== null) {
          const name = pubhtmlMatch[1].trim();
          if (name) tabsSet.add(name);
        }

        const anchorRegex = /<a href="[^"]*gid=[0-9]+[^"]*"[^>]*>([^<]+)</g;
        let anchorMatch;
        while ((anchorMatch = anchorRegex.exec(text)) !== null) {
          const name = anchorMatch[1].trim();
          if (name && name.length < 50) tabsSet.add(name);
        }

        // Also extract other general tab names from the sheet-tab elements in Google HTML view
        const tabNameRegex = /class="sheet-tab-name">([^<]+)</g;
        let tabMatch;
        while ((tabMatch = tabNameRegex.exec(text)) !== null) {
          const name = tabMatch[1].trim();
          if (name) tabsSet.add(name);
        }

        // Search for sheet name references in JSON structures: "name":"..." or "sheetName":"..."
        const jsonNameRegex = /"name"\s*:\s*"([^"]+)"/g;
        let jsonMatch;
        while ((jsonMatch = jsonNameRegex.exec(text)) !== null) {
          const name = jsonMatch[1].trim();
          if (name && name.length < 30 && !['spreadsheet', 'user', 'theme', 'grid', 'font', 'styles'].includes(name.toLowerCase())) {
            tabsSet.add(name);
          }
        }
      };

      extractDates(htmlText);

      if (tabsSet.size === 0 && !isPublished) {
        console.log('[Public Info Proxy] htmlview empty, attempting to scrape edit endpoint...');
        const editUrl = `https://docs.google.com/spreadsheets/d/${idStr}/edit`;
        const editResponse = await fetch(editUrl, {
          headers: {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/100.0.0.0 Safari/537.36'
          }
        });
        if (editResponse.ok) {
          const editHtml = await editResponse.text();
          extractDates(editHtml);
        }
      }

      const tabs = Array.from(tabsSet).sort().reverse(); // Sort list nicely
      console.log(`[Public Info Proxy] Successfully extracted ${tabs.length} tabs:`, tabs);

      res.json({
        id: spreadsheetId,
        title: 'Daily Hierarchical News Backup',
        tabs: tabs.length > 0 ? tabs : [new Date().toISOString().split('T')[0]]
      });
    } catch (err: any) {
      // Fallback: return today's tab and previous days if scraping is blocked or fails
      const fallbackTabs: string[] = [];
      for (let i = 0; i < 7; i++) {
        const d = new Date();
        d.setDate(d.getDate() - i);
        const pad = (n: number) => n.toString().padStart(2, '0');
        fallbackTabs.push(`${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`);
      }
      res.json({
        id: spreadsheetId,
        title: 'Daily Hierarchical News Backup (Fallback List)',
        tabs: fallbackTabs
      });
    }
  });

  // Proxy to fetch news rows of a specific date or gid from a public spreadsheet tab
  app.get('/api/public-sheet-news', async (req, res) => {
    const spreadsheetId = req.query.spreadsheetId || 'e/2PACX-1vSesHAf2i4cSydOiMSszcwC1sRz7yh6tiyVSQqbgAtnczqjqlwNhuw4nM-yjCeYL4OHNQkUq1y2K0t6';
    const dateStr = req.query.date || '';
    let gid = req.query.gid || '';
    const sheetName = req.query.sheetName || dateStr || '';
    const idStr = String(spreadsheetId);
    const isPublished = idStr.startsWith('e/') || idStr.includes('e/2PACX-') || idStr.includes('2PACX-');

    try {
      // Build the export CSV URL based on available identifiers, prioritizing gid, then sheetName, then dateStr
      let url = '';
      if (isPublished) {
        // Find GID from name for published sheets because &sheet= is NOT supported for pub.
        if (!gid && sheetName) {
           const infoUrl = `https://docs.google.com/spreadsheets/d/${idStr}/pubhtml`;
           const infoRes = await fetch(infoUrl, {
             headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)' }
           });
           if (infoRes.ok) {
             const html = await infoRes.text();
             const jsonRegex = /{uid:\s*'([^']+)',\s*name:\s*['"]([^'"]+)['"]/g;
             let jsonMatch;
             while ((jsonMatch = jsonRegex.exec(html)) !== null) {
               if (jsonMatch[2] === sheetName) {
                  gid = jsonMatch[1];
                  break;
               }
             }
             if (!gid) {
               const gidRegex = new RegExp(`name:\\s*['"]${String(sheetName)}['"][^}]*gid:\\s*['"](\\d+)['"]`);
               const gm = html.match(gidRegex);
               if (gm) gid = gm[1];
             }
           }
        }
        url = `https://docs.google.com/spreadsheets/d/${idStr}/pub?output=csv`;
        if (gid) {
          url += `&single=true&gid=${gid}`;
        }
        console.log(`[Public News Proxy] Fetching public published web sheet via URL: ${url}`);
      } else {
        url = `https://docs.google.com/spreadsheets/d/${idStr}/export?format=csv`;
        if (gid) {
          url += `&gid=${gid}`;
          console.log(`[Public News Proxy] Fetching public sheet news via gid: ${gid}`);
        } else if (sheetName) {
          url += `&sheet=${encodeURIComponent(String(sheetName))}`;
          console.log(`[Public News Proxy] Fetching public sheet news via sheetName: ${sheetName}`);
        } else {
          console.log(`[Public News Proxy] Fetching public sheet news (first default sheet)`);
        }
      }
      
      let response = await fetch(url, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/100.0.0.0 Safari/537.36'
        }
      });
      
      let csvText = '';
      if (!response.ok) {
        const fallbackUrl = isPublished
          ? `https://docs.google.com/spreadsheets/d/${idStr}/pub?output=csv`
          : `https://docs.google.com/spreadsheets/d/${idStr}/export?format=csv`;
        const fallbackResponse = await fetch(fallbackUrl, {
          headers: {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/100.0.0.0 Safari/537.36'
          }
        });
        if (!fallbackResponse.ok) {
          throw new Error(`Google Sheets responded with HTTP status ${fallbackResponse.status} (Workbook not found or inaccessible)`);
        }
        // Fallback succeeded, indicating the spreadsheet does exist but the requested tab is missing.
        return res.json({ success: true, newsItems: [] });
      } else {
        csvText = await response.text();
      }

      if (csvText.trim().startsWith('<html') || csvText.trim().startsWith('<!DOCTYPE html') || csvText.includes('Google Accounts') || csvText.includes('ServiceLogin')) {
        return res.status(403).json({
          success: false,
          error: "Permission Denied: This Google Sheet has restricted settings. To allow the app to view it, click the blue 'Share' button in Google Sheets and select 'Anyone with the link can view' (as a Viewer)."
        });
      }

      const rows = parseCSV(csvText);
      if (rows.length <= 1) {
        return res.json({ success: true, newsItems: [] });
      }

      const headers = rows[0].map(h => h.trim().toLowerCase());
      const dataRows = rows.slice(1);

      const colMap = {
        id: headers.indexOf('id'),
        level: headers.indexOf('level'),
        parentId: headers.indexOf('parentid'),
        categoryName: headers.indexOf('categoryname'),
        title: headers.indexOf('title'),
        summary: headers.indexOf('summary'),
        source: headers.indexOf('source'),
        link: headers.indexOf('link'),
        imageUrl: headers.indexOf('imageurl'),
        changePercent: headers.indexOf('changepercent'),
        benchmarkLabel: headers.indexOf('benchmarklabel'),
        capGroup: headers.indexOf('capgroup')
      };

      const newsItems = dataRows.map((row, index) => {
        const getValue = (colIndex: number) => (colIndex !== -1 && colIndex < row.length ? row[colIndex] : '');
        const pctVal = getValue(colMap.changePercent);
        const parsedPct = pctVal !== '' ? parseFloat(String(pctVal).replace(/%/g, '')) : undefined;

        const rawCap = getValue(colMap.capGroup);
        let parsedCap = undefined;
        if (rawCap && ['large', 'mid', 'small'].includes(rawCap.trim().toLowerCase())) {
          parsedCap = rawCap.trim().charAt(0).toUpperCase() + rawCap.trim().slice(1).toLowerCase();
        }

        return {
          id: getValue(colMap.id) || `row-${index}`,
          level: getValue(colMap.level) || 'Global',
          parentId: getValue(colMap.parentId) || null,
          categoryName: getValue(colMap.categoryName) || 'General',
          title: getValue(colMap.title) || 'Untitled',
          summary: getValue(colMap.summary) || '',
          source: getValue(colMap.source) || 'Unknown Source',
          link: getValue(colMap.link) || undefined,
          imageUrl: getValue(colMap.imageUrl) || undefined,
          changePercent: isNaN(parsedPct as any) ? undefined : parsedPct,
          benchmarkLabel: getValue(colMap.benchmarkLabel) || undefined,
          capGroup: parsedCap,
          date: String(dateStr)
        };
      });

      res.json({ success: true, newsItems });
    } catch (err: any) {
      try {
        const liveItems = await fetchLiveNewsTree(String(dateStr || new Date().toISOString().split('T')[0]));
        return res.json({ success: true, newsItems: liveItems });
      } catch (fallbackErr) {
        let errorMessage = err.message || 'Failed to fetch from Google Sheets';
        if (errorMessage.includes('404')) {
           errorMessage += '. Please ensure the Google Sheet is Published to the Web (File -> Share -> Publish to web) or has link sharing turned on.';
        }
        return res.status(400).json({ success: false, error: errorMessage });
      }
    }
  });

// API Route to fetch real structured news mapped hierarchical pathways.
  app.post('/api/generate-news', async (req, res) => {
    const { dateStr } = req.body;
    const targetDate = dateStr || new Date().toISOString().split('T')[0];

    try {
      const apiKey = process.env.GEMINI_API_KEY;
      if (!apiKey) {
        console.warn('[AI Reader] GEMINI_API_KEY is not defined. Fetching live RSS news directly.');
        const liveNews = await fetchLiveNewsTree(targetDate);
        return res.json({
          success: true,
          date: targetDate,
          newsItems: liveNews,
          isFallback: false,
          notice: 'Fetched today’s live headlines directly from RSS news sources.'
        });
      }

      // Tier 1: IBM WatsonX (GLOBAL_RULES §1)
      const wxNews = await generateNewsWithWatsonx(targetDate);
      if (wxNews) {
        console.log('[AI] ✅ WatsonX news generation succeeded');
        return res.json({ success: true, date: targetDate, newsItems: wxNews, isFallback: false, provider: 'watsonx' });
      }
      console.log('[AI] WatsonX unavailable → trying Gemini');

      // Tier 2: Gemini (structured output)
      const ai = new GoogleGenAI({
        apiKey: apiKey,
        httpOptions: {
          headers: {
            'User-Agent': 'aistudio-build',
          }
        }
      });

      console.log(`[AI Reader] Fetching news from famous portals (Moneycontrol, Google News, Bloomberg) for date target: ${targetDate}`);

      // Search Grounding Prompt that ensures real articles from prestigious financial/tech streams are used
      const prompt = `Perform query-level search for current news headlines and stock market articles around the date ${targetDate} or latest.
Search famous news streams like Moneycontrol, Bloomberg Markets, Google News, Reuters, Economic Times and Financial Times.
Then, build a cohesive, connected daily news map (hierarchy) from these true stories.
The output MUST be a strict hierarchical tree where child nodes reference their parent nodes exactly using parentId:
Each level is ordered as: Global -> Geography -> Country -> Sector -> Industry -> Stock.

Generate EXACTLY thirteen (13) news stories, strictly mapped as follows:
1. One (1) 'Global' headline story. ID: 'G_AUTO_1', parentId: null. E.g., Major worldwide inflation, interest rate shifts, or G7 policy statements.
2. Two (2) 'Geography' stories.
   - 'GEO_AUTO_1' (e.g. Asia-Pacific or European Market Shifts), which must be a child of 'G_AUTO_1'.
   - 'GEO_AUTO_2' (e.g. North American Core Markets), which must be a child of 'G_AUTO_1'.
3. Two (2) 'Country' stories:
   - 'C_AUTO_1' (e.g. India Economy Indicators), which must be a child of 'GEO_AUTO_1'.
   - 'C_AUTO_2' (e.g. United States Market Resilience), which must be a child of 'GEO_AUTO_2'.
4. Two (2) 'Sector' stories:
   - 'S_AUTO_1' (e.g. Technology & Cloud Services), which must be a child of 'C_AUTO_1'.
   - 'S_AUTO_2' (e.g. Tech Hardware, Chips & Semiconductors), which must be a child of 'C_AUTO_2'.
5. Two (2) 'Industry' stories:
   - 'I_AUTO_1' (e.g. SaaS & Digital Transformation), which must be a child of 'S_AUTO_1'.
   - 'I_AUTO_2' (e.g. Chip Foundations & Advanced GPU Accelerators), which must be a child of 'S_AUTO_2'.
6. Four (4) 'Stock' stories:
   - 'ST_AUTO_1' under I_AUTO_1 (e.g. Infosys Corp - NSE: INFY)
   - 'ST_AUTO_2' under I_AUTO_1 (e.g. Tata Consultancy Services - NSE: TCS)
   - 'ST_AUTO_3' under I_AUTO_2 (e.g. NVIDIA Corp - NASDAQ: NVDA)
   - 'ST_AUTO_4' under I_AUTO_2 (e.g. Advanced Micro Devices - NASDAQ: AMD)

Requirements for each item in the array:
- id: Exact string matching 'G_AUTO_1', 'GEO_AUTO_1', 'GEO_AUTO_2', etc.
- level: One of 'Global', 'Geography', 'Country', 'Sector', 'Industry', 'Stock'.
- parentId: Correct immediate parent ID as outlined above, or null for Global.
- categoryName: Clean label e.g. "Global Macro", "Asia-Pacific", "India", "Technology & Consulting", "SaaS & AI Agents", "NVIDIA Corp". For stocks, make it the real company name.
- title: A spectacular, high-impact headline as published on Moneycontrol, Reuters, or Bloomberg.
- summary: A beautiful, comprehensive, highly detailed, and in-depth professional editorial summary of around 120-160 words (double standard length) providing deep background context, key named participants, specific metrics, precise reasons, implications, and global economic consequences. Embellish with actual metrics (e.g. export percentages, inflation bases, market capitalization valuation changes).
- source: The real portal name (e.g., "Moneycontrol", "Google News", "Bloomberg Markets", "Reuters", "The Economic Times").
- link: Use the real, realistic news link from that source.
- imageUrl: A spectacular Unsplash image URL that matches the physical context (e.g. trading desks, chip wafer prints, cityscapes).
- changePercent: A numeric value matching the daily price/metric change percentage of the corresponding stock, currency index, or GDP basis (e.g., 2.35, -1.20, 0.45). Set to 0 if there is no specific financial change.
- benchmarkLabel: The respective asset ticker code or benchmark index name (e.g., "MSCI World", "S&P 500", "NIFTY 50", "INFY", "NVDA", "USD/INR", "GDP Basis").

Ensure strict JSON output structure matching the provided schema.`;

      // Utilize gemini-3.5-flash for maximum text/grounding speed and capability
      const response = await ai.models.generateContent({
        model: 'gemini-3.5-flash',
        contents: prompt,
        config: {
          tools: [{ googleSearch: {} }],
          responseMimeType: 'application/json',
          responseSchema: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                id: { type: Type.STRING },
                level: { type: Type.STRING },
                parentId: { type: Type.STRING, nullable: true },
                categoryName: { type: Type.STRING },
                title: { type: Type.STRING },
                summary: { type: Type.STRING },
                source: { type: Type.STRING },
                link: { type: Type.STRING },
                imageUrl: { type: Type.STRING },
                changePercent: { type: Type.NUMBER, nullable: true },
                benchmarkLabel: { type: Type.STRING, nullable: true }
              },
              required: ['id', 'level', 'parentId', 'categoryName', 'title', 'summary', 'source', 'link', 'imageUrl', 'changePercent', 'benchmarkLabel']
            }
          }
        }
      });

      const responseText = response.text;
      if (!responseText) {
        throw new Error('Empirical text body returned from Gemini is empty.');
      }

      const generatedNews = JSON.parse(responseText.trim());

      res.json({
        success: true,
        date: targetDate,
        newsItems: generatedNews,
        isFallback: false
      });

    } catch (error: any) {
      console.error('[AI Reader Backend live fetch fallback triggered]:', error);

      try {
        const liveNews = await fetchLiveNewsTree(targetDate);
        return res.json({
          success: true,
          date: targetDate,
          newsItems: liveNews,
          isFallback: false,
          notice: 'Fetched today’s live headlines directly from RSS news sources after the outlet returned an error.'
        });
      } catch (fallbackError: any) {
        return res.status(502).json({
          success: false,
          error: `Unable to fetch today’s live news headlines: ${fallbackError.message}`
        });
      }
    }
  });

  // Alias: GET /api/news — returns live RSS hierarchy for NewsMapPage integration
  app.get('/api/news', async (req, res) => {
    try {
      const targetDate = new Date().toISOString().split('T')[0];
      const items = await fetchLiveNewsTree(targetDate);
      res.json({ success: true, items, count: items.length, source: 'rss-live' });
    } catch (e) {
      res.status(500).json({ success: false, error: (e as Error).message, items: [] });
    }
  });

  // Vite development middleware vs Static serve
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa'
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`[Full-stack Server] Operational at http://0.0.0.0:${PORT}`);
  });
}

startServer();
