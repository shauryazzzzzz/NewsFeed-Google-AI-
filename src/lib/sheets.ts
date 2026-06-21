import { NewsItem, HierarchyLevel, SpreadsheetInfo } from '../types';
import { generate75NewsStories } from './newsGenerator';

async function sheetsFetch(url: string, token: string, options: RequestInit = {}) {
  const headers = new Headers(options.headers || {});
  headers.set('Authorization', `Bearer ${token}`);
  headers.set('Content-Type', 'application/json');

  const res = await fetch(url, { ...options, headers });
  if (!res.ok) {
    const text = await res.text();
    let errMsg = `Sheets API error (${res.status})`;
    try {
      const parsed = JSON.parse(text);
      if (parsed.error?.message) {
        errMsg = parsed.error.message;
      }
    } catch (e) {}
    throw new Error(errMsg);
  }
  return res.json();
}

export async function listUserSpreadsheets(token: string): Promise<{ id: string; name: string }[]> {
  const url = `https://www.googleapis.com/drive/v3/files?q=mimeType='application/vnd.google-apps.spreadsheet'+and+trashed=false&fields=files(id,name)&orderBy=name+desc`;
  const data = await sheetsFetch(url, token);
  return data.files || [];
}

export async function fetchSpreadsheetInfo(token: string, spreadsheetId: string): Promise<SpreadsheetInfo> {
  const url = `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}`;
  const data = await sheetsFetch(url, token);
  
  const title = data.properties?.title || 'Daily Hierarchical News';
  const tabs = (data.sheets || []).map((sheet: any) => sheet.properties?.title as string)
    .filter((title: string) => /^\d{4}-\d{2}-\d{2}$/.test(title)); // standard YYYY-MM-DD tabs

  return {
    id: spreadsheetId,
    title,
    tabs: tabs.sort().reverse() // newest dates first
  };
}

export async function createNewSpreadsheet(token: string, title: string, todayDateStr: string): Promise<string> {
  const url = `https://sheets.googleapis.com/v4/spreadsheets`;
  const body = {
    properties: {
      title
    },
    sheets: [
      {
        properties: {
          title: todayDateStr
        }
      }
    ]
  };

  const spreadsheet = await sheetsFetch(url, token, {
    method: 'POST',
    body: JSON.stringify(body)
  });

  const spreadsheetId = spreadsheet.spreadsheetId;
  if (!spreadsheetId) {
    throw new Error('Failed to obtain spreadsheet ID from response');
  }

  // Populate with starting sample data
  await populateTabWithSampleData(token, spreadsheetId, todayDateStr);

  return spreadsheetId;
}

export async function createNewTab(token: string, spreadsheetId: string, dateStr: string): Promise<void> {
  const url = `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}:batchUpdate`;
  const body = {
    requests: [
      {
        addSheet: {
          properties: {
            title: dateStr
          }
        }
      }
    ]
  };

  await sheetsFetch(url, token, {
    method: 'POST',
    body: JSON.stringify(body)
  });

  // Populate newly created tab with default structure and sample headlines
  await populateTabWithSampleData(token, spreadsheetId, dateStr);
}

export async function fetchNewsFromTab(token: string, spreadsheetId: string, dateStr: string): Promise<NewsItem[]> {
  const url = `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/${encodeURIComponent(dateStr)}!A1:K100`;
  const data = await sheetsFetch(url, token);
  
  if (!data.values || data.values.length <= 1) {
    return [];
  }

  const [headers, ...rows] = data.values;
  
  // Create field mappings in case user reorders columns
  const colMap = {
    id: headers.findIndex((h: string) => h.toLowerCase() === 'id'),
    level: headers.findIndex((h: string) => h.toLowerCase() === 'level'),
    parentId: headers.findIndex((h: string) => h.toLowerCase() === 'parentid'),
    categoryName: headers.findIndex((h: string) => h.toLowerCase() === 'categoryname'),
    title: headers.findIndex((h: string) => h.toLowerCase() === 'title'),
    summary: headers.findIndex((h: string) => h.toLowerCase() === 'summary'),
    source: headers.findIndex((h: string) => h.toLowerCase() === 'source'),
    link: headers.findIndex((h: string) => h.toLowerCase() === 'link'),
    imageUrl: headers.findIndex((h: string) => h.toLowerCase() === 'imageurl'),
    changePercent: headers.findIndex((h: string) => h.toLowerCase() === 'changepercent'),
    benchmarkLabel: headers.findIndex((h: string) => h.toLowerCase() === 'benchmarklabel'),
    capGroup: headers.findIndex((h: string) => h.toLowerCase() === 'capgroup')
  };

  return rows.map((row: any[], index: number) => {
    const getValue = (colIndex: number) => (colIndex !== -1 && colIndex < row.length ? row[colIndex] : '');
    const pctVal = getValue(colMap.changePercent);
    const parsedPct = pctVal !== '' ? parseFloat(String(pctVal).replace(/%/g, '')) : undefined;

    const rawCap = getValue(colMap.capGroup);
    let parsedCap: 'Large' | 'Mid' | 'Small' | undefined = undefined;
    if (rawCap && ['large', 'mid', 'small'].includes(rawCap.trim().toLowerCase())) {
      parsedCap = (rawCap.trim().charAt(0).toUpperCase() + rawCap.trim().slice(1).toLowerCase()) as any;
    } else {
      // Intelligently infer based on company name
      const titleLower = getValue(colMap.title).toLowerCase() || '';
      const catLower = getValue(colMap.categoryName).toLowerCase() || '';
      if (titleLower.includes('infosys') || catLower.includes('infosys') || titleLower.includes('tcs') || catLower.includes('tcs') || titleLower.includes('wipro') || catLower.includes('wipro')) {
        parsedCap = 'Large';
      } else if (titleLower.includes('lti') || catLower.includes('lti') || titleLower.includes('coforge') || catLower.includes('coforge')) {
        parsedCap = 'Mid';
      } else if (titleLower.includes('saksoft') || catLower.includes('saksoft') || titleLower.includes('kellton') || catLower.includes('kellton')) {
        parsedCap = 'Small';
      }
    }

    return {
      id: getValue(colMap.id) || `row-${index}`,
      level: (getValue(colMap.level) as HierarchyLevel) || 'Global',
      parentId: getValue(colMap.parentId) || null,
      categoryName: getValue(colMap.categoryName) || 'General',
      title: getValue(colMap.title) || 'untitled',
      summary: getValue(colMap.summary) || '',
      source: getValue(colMap.source) || 'Unknown Source',
      link: getValue(colMap.link) || undefined,
      imageUrl: getValue(colMap.imageUrl) || undefined,
      changePercent: isNaN(parsedPct as any) ? undefined : parsedPct,
      benchmarkLabel: getValue(colMap.benchmarkLabel) || undefined,
      capGroup: parsedCap,
      date: dateStr
    };
  });
}

export async function appendNewsToTab(token: string, spreadsheetId: string, dateStr: string, items: NewsItem[]): Promise<void> {
  const url = `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/${encodeURIComponent(dateStr)}!A1:append?valueInputOption=USER_ENTERED`;
  
  const rows = items.map(item => [
    item.id,
    item.level,
    item.parentId || '',
    item.categoryName,
    item.title,
    item.summary,
    item.source,
    item.link || '',
    item.imageUrl || '',
    item.changePercent !== undefined ? `${item.changePercent}%` : '',
    item.benchmarkLabel || '',
    item.capGroup || ''
  ]);

  await sheetsFetch(url, token, {
    method: 'POST',
    body: JSON.stringify({
      range: `${dateStr}!A1`,
      majorDimension: 'ROWS',
      values: rows
    })
  });
}

export async function overwriteTabWithAIStories(token: string, spreadsheetId: string, dateStr: string, items: NewsItem[]): Promise<void> {
  const url = `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/${encodeURIComponent(dateStr)}!A1:K100?valueInputOption=USER_ENTERED`;
  
  const formattedRows: any[][] = [
    ['ID', 'Level', 'ParentID', 'CategoryName', 'Title', 'Summary', 'Source', 'Link', 'ImageURL', 'ChangePercent', 'BenchmarkLabel', 'CapGroup'],
    ...items.map(item => [
      item.id,
      item.level,
      item.parentId || '',
      item.categoryName,
      item.title,
      item.summary,
      item.source,
      item.link || '',
      item.imageUrl || '',
      item.changePercent !== undefined ? `${item.changePercent}%` : '',
      item.benchmarkLabel || '',
      item.capGroup || ''
    ])
  ];

  await sheetsFetch(url, token, {
    method: 'PUT',
    body: JSON.stringify({
      range: `${dateStr}!A1:K100`,
      majorDimension: 'ROWS',
      values: formattedRows
    })
  });
}

export async function populateTabWithSampleData(token: string, spreadsheetId: string, dateStr: string): Promise<void> {
  const url = `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/${encodeURIComponent(dateStr)}!A1:L150?valueInputOption=USER_ENTERED`;
  
  const sampleNews: any[][] = [
    ['ID', 'Level', 'ParentID', 'CategoryName', 'Title', 'Summary', 'Source', 'Link', 'ImageURL', 'ChangePercent', 'BenchmarkLabel', 'CapGroup'],
    
    // Level 0: Global
    [
      'G1', 
      'Global', 
      '', 
      'Global Economy', 
      'Global Markets Pivot on Inflation Data & High Interest Rates', 
      'World stock markets fluctuated wildy as consumer demand prints came in mixed. Investors globally are watching closely for signals from premier monetary authorities on easing credit restrictions in the final quarters, shifting massive cross-border asset reallocations.', 
      'Financial Times', 
      'https://ft.com', 
      'https://images.unsplash.com/photo-1526304640581-d334cdbbf45e?auto=format&fit=crop&w=600&q=80',
      '0.25%',
      'MSCI World INDEX',
      ''
    ],
    
    // Level 1: Geography under G1
    [
      'GEO1', 
      'Geography', 
      'G1', 
      'Asia-Pacific', 
      'Asia-Pacific Technology Markets Lead Relocation Wave', 
      'The broader APAC region reports strong export volumes matching double-digit hardware manufacturing shifts. Tech-friendly economic policies across key tech corridors keep valuations buoyed amid local consumption tailwinds.', 
      'Reuters', 
      'https://reuters.com', 
      'https://images.unsplash.com/photo-1444653389962-8149286c578a?auto=format&fit=crop&w=600&q=80',
      '1.15%',
      'APAC Index',
      ''
    ],
    [
      'GEO2', 
      'Geography', 
      'G1', 
      'North America', 
      'North American Supply Lines Scale Fab Infrastructure', 
      'US and Canadian corporate capitals are fast-tracking data-center investments. The continent is seeing monumental build schemes aimed at localizing silicon lines, fueled by multi-billion public grants and state mandates.', 
      'Bloomberg', 
      'https://bloomberg.com', 
      'https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?auto=format&fit=crop&w=600&q=80',
      '-0.48%',
      'S&P 500',
      ''
    ],
    
    // Level 2: Country
    [
      'C1', 
      'Country', 
      'GEO1', 
      'India', 
      'India Gains Ground in Global Advanced Electronics Assembly', 
      'India\'s production incentive strategies have successfuly drawn international hardware titans to double assembly operations. Domestic manufacturing clusters expand rapidly, creating professional engineering workforces at scale.', 
      'Economic Times', 
      'https://economictimes.indiatimes.com', 
      'https://images.unsplash.com/photo-1532375811409-90d11193060b?auto=format&fit=crop&w=600&q=80',
      '1.25%',
      'NIFTY 50',
      ''
    ],
    [
      'C2', 
      'Country', 
      'GEO2', 
      'United States', 
      'United States Approves Billions for Advanced Chip Fabs', 
      'Federal agencies unlocked a massive second tranche of domestic manufacturing grants. New fabrication facilities across Arizona, Oregon and Ohio are breaking ground to anchor regional hardware independence.', 
      'WSJ', 
      'https://wsj.com', 
      'https://images.unsplash.com/photo-1516321318423-f06f85e504b3?auto=format&fit=crop&w=600&q=80',
      '-0.15%',
      'NASDAQ',
      ''
    ],
    
    // Level 3: Sector
    [
      'S1', 
      'Sector', 
      'C1', 
      'Technology & IT', 
      'NIFTY IT Index Surges as Government Announces Tax Relief for Digital Exporters', 
      'The subcontinental IT services sector is receiving heavy digital infrastructure modernizing workloads. A surge in long-term enterprise SaaS contracts and hybrid cloud optimization requests are leading to positive guidance for top-tier software exporters.', 
      'TechCrunch', 
      'https://techcrunch.com', 
      'https://images.unsplash.com/photo-1518770660439-4636190af475?auto=format&fit=crop&w=600&q=80',
      '2.40%',
      'NIFTY IT Index',
      ''
    ],
    [
      'S2', 
      'Sector', 
      'C2', 
      'Tech Hardware & Systems', 
      'US Tech Infrastructure Directing Capital into GPU Clusters', 
      'With demand for AI model training skyrocketing, major tech providers are upgrading their hardware footprints. Venture backing is reallocating toward custom chips, cooling setups, and fiber grids.', 
      'Wired', 
      'https://wired.com', 
      'https://images.unsplash.com/photo-1558494949-ef010cbdcc31?auto=format&fit=crop&w=600&q=80',
      '1.10%',
      'SOX Index',
      ''
    ],
    
    // Level 4: Industry
    [
      'I1', 
      'Industry', 
      'S1', 
      'IT Services & Consulting', 
      'NIFTYITBEES Attracts Heavy Accruals as IT Budgets Pivot Back to Offshore Fabs', 
      'Software-as-a-service platforms and consulting services are shifting pricing away from user seats toward agentic workflow completions. Automated client handling and code debugging units show high enterprise subscription rates.', 
      'SaaS Business Journal', 
      'https://saasbj.com', 
      'https://images.unsplash.com/photo-1460925895917-afdab827c52f?auto=format&fit=crop&w=600&q=80',
      '1.85%',
      'NIFTYITBEES',
      ''
    ],
    [
      'I2', 
      'Industry', 
      'S2', 
      'Semiconductors & Accelerators', 
      'Silicon Designers Focus on Dynamic Power-Management Tooling', 
      'As power budgets spike at global datacenters, the primary design challenge has turned from compute speed to watts-per-flop efficiency. Breakthroughs in packaging and custom instructions show high promise.', 
      'Semiconductor Today', 
      'https://semitoday.com', 
      'https://images.unsplash.com/photo-1518770660439-4636190af475?auto=format&fit=crop&w=600&q=80',
      '2.90%',
      'WFE Capex Index',
      ''
    ],
    
    // Level 5: Stocks (Large-Cap)
    [
      'ST1', 
      'Stock', 
      'I1', 
      'Infosys Corp', 
      'Infosys Secures Massive $1.5 Billion Multi-Year Cloud Upgrade Contract', 
      'Shares of Infosys rallied after closing a mega-deal with an international banking client to revitalize their entire digital ledger stack and configure cloud integrations, bringing stable recurring revenues.', 
      'NDTV Profit', 
      'https://ndtv.com', 
      'https://images.unsplash.com/photo-1542744094-3a31f103e35f?auto=format&fit=crop&w=600&q=80',
      '3.40%',
      'INFY',
      'Large'
    ],
    [
      'ST2', 
      'Stock', 
      'I1', 
      'Tata Consultancy Services', 
      'TCS Partners with Major EU Insurer for Automation Migration', 
      'TCS reports landing a major long-term contract to migrate core transaction processing engines to secure cloud environments, utilizing tailored SaaS layouts and AI agents to handle millions of policy claims.', 
      'MoneyControl', 
      'https://moneycontrol.com', 
      'https://images.unsplash.com/photo-1551836022-d5d88e9218df?auto=format&fit=crop&w=600&q=80',
      '1.95%',
      'TCS',
      'Large'
    ],
    [
      'ST5', 
      'Stock', 
      'I1', 
      'Wipro Ltd', 
      'Wipro Lands Strategic Cloud Optimization & Security Deal', 
      'Wipro shares advanced as the firm announced a comprehensive digital infrastructure contract with an APAC energy provider to secure endpoint systems and modernize high-throughput operational software databases.', 
      'NDTV Profit', 
      'https://ndtv.com', 
      'https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?auto=format&fit=crop&w=600&q=80',
      '2.15%',
      'WIPRO',
      'Large'
    ],
    // Mid-Cap Stocks
    [
      'ST_MID1', 
      'Stock', 
      'I1', 
      'LTIMindtree Ltd', 
      'LTIMindtree Clinches Double Digital Engineering Acceleration Orders', 
      'LTIMindtree stock surged as the mid-cap IT major closed multiple high-velocity digital engineering deals with global logistics aggregates, reinforcing strong demand resilience outside the traditional Big-3.', 
      'Economic Times', 
      'https://economictimes.indiatimes.com', 
      'https://images.unsplash.com/photo-1460925895917-afdab827c52f?auto=format&fit=crop&w=600&q=80',
      '2.80%',
      'LTIM',
      'Mid'
    ],
    [
      'ST_MID2', 
      'Stock', 
      'I1', 
      'Coforge Ltd', 
      'Coforge Stock Rallies After Upgrading Yearly Margin & Contract Guidance', 
      'Coforge Limited shares surged 3.1% today after revealing an improved revenue conversion pipeline on newly completed insurance and banking platform modernizations, outperforming general street estimates.', 
      'MoneyControl', 
      'https://moneycontrol.com', 
      'https://images.unsplash.com/photo-1502920514313-52581002a659?auto=format&fit=crop&w=600&q=80',
      '3.10%',
      'COFORGE',
      'Mid'
    ],
    // Small-Cap Stocks
    [
      'ST_SMALL1', 
      'Stock', 
      'I1', 
      'Saksoft Ltd', 
      'Saksoft Accelerates Global Penetration With Acquisition of Zurich Niche Practice', 
      'Saksoft Limited reported that its overseas subsidiaries have finalized terms to acquire a boutique analytics consultancy based in Switzerland. This small-cap firm aims to capitalize on premium regional margins.', 
      'Economic Times', 
      'https://economictimes.indiatimes.com', 
      'https://images.unsplash.com/photo-1542744094-3a31f103e35f?auto=format&fit=crop&w=600&q=80',
      '4.55%',
      'SAKSOFT',
      'Small'
    ],
    [
      'ST_SMALL2', 
      'Stock', 
      'I1', 
      'Kellton Tech Solutions', 
      'Kellton Tech Secures Core Digital Ledger Modernization in Middle East', 
      'Kellton Tech Solutions stock touched active daily upper limits following structural digital ledger integration bookings from an oil-rich sovereign logistics manager, boosting small-cap investor confidence.', 
      'Reuters', 
      'https://reuters.com', 
      'https://images.unsplash.com/photo-1516321318423-f06f85e504b3?auto=format&fit=crop&w=600&q=80',
      '5.20%',
      'KELLTONTEC',
      'Small'
    ]
  ];

  await sheetsFetch(url, token, {
    method: 'PUT',
    body: JSON.stringify({
      range: `${dateStr}!A1:L150`,
      majorDimension: 'ROWS',
      values: sampleNews
    })
  });
}

export async function seed500PastWeekNews(token: string, spreadsheetId: string): Promise<string[]> {
  // Generate past 7 dates
  const dates: string[] = [];
  for (let i = 0; i < 7; i++) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    const pad = (n: number) => n.toString().padStart(2, '0');
    const dateStr = `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
    dates.push(dateStr);
  }

  const seededTabs: string[] = [];

  for (const dateStr of dates) {
    try {
      // 1. Safe Tab creation via batchUpdate (ignore if already exists)
      const url = `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}:batchUpdate`;
      const body = {
        requests: [
          {
            addSheet: {
              properties: {
                title: dateStr
              }
            }
          }
        ]
      };
      
      try {
        await sheetsFetch(url, token, {
          method: 'POST',
          body: JSON.stringify(body)
        });
      } catch (tabErr) {
        // Tab already exists or format conflict - continue to overwrite safely
        console.log(`Tab ${dateStr} already exists or failed to create. Proceeding anyway.`);
      }

      // 2. Generate exactly 75 highly varied stories for this date
      const items = generate75NewsStories(dateStr);

      // 3. Overwrite sheet data in the designated tab with the bulk set
      await overwriteTabWithAIStories(token, spreadsheetId, dateStr, items);
      seededTabs.push(dateStr);
    } catch (err: any) {
      console.error(`Failed to seed date tab ${dateStr}:`, err);
    }
  }

  return seededTabs;
}
