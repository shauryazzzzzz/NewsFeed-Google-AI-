import { NewsItem, HierarchyLevel } from '../types';

// Helper to determine cap group for Stocks
function getCapGroup(ticker: string): 'Large' | 'Mid' | 'Small' | '' {
  const largeCaps = ['INFY', 'TCS', 'WIPRO', 'RELIANCE', 'HDFCBANK', 'ICICIBANK', 'NVDA', 'TSLA', 'AAPL', 'MSFT', 'AMZN', 'GOOGL', 'TSM', 'ASML', 'JPM'];
  const midCaps = ['LTIM', 'COFORGE', 'KPIT', 'PERSISTENT', 'TATAMOTORS', 'AMD', 'ARM', 'AVGO', 'QCOM', 'MU'];
  const smallCaps = ['SAKSOFT', 'KELLTONTEC', 'MPHASIS', 'RIVN', 'LCID', 'NIO', 'PAYTM'];
  
  if (largeCaps.includes(ticker)) return 'Large';
  if (midCaps.includes(ticker)) return 'Mid';
  if (smallCaps.includes(ticker)) return 'Small';
  return '';
}

export function generate75NewsStories(dateStr: string): NewsItem[] {
  // Generate slightly different metrics based on hash of the date to make it realistic
  const getSeedMetric = (base: number, variance: number, id: string) => {
    let hash = 0;
    const str = dateStr + id;
    for (let i = 0; i < str.length; i++) {
      hash = str.charCodeAt(i) + ((hash << 5) - hash);
    }
    const noise = (Math.abs(hash) % 100) / 100; // 0.0 to 1.0
    const finalVal = base + (noise * 2 - 1) * variance;
    return parseFloat(finalVal.toFixed(2));
  };

  const getSeedSign = (id: string) => {
    let hash = 0;
    const str = dateStr + id;
    for (let i = 0; i < str.length; i++) {
      hash = str.charCodeAt(i) + ((hash << 5) - hash);
    }
    return hash % 2 === 0 ? 1 : -1;
  };

  // 1. Level: Global
  const globalStories = [
    {
      id: 'G1',
      level: 'Global' as HierarchyLevel,
      parentId: null,
      categoryName: 'Global Macroeconomy',
      title: `Global Central Banks Pivot Interest Rate Guidance Following Positive Consumer Capital Runs on ${dateStr}`,
      summary: `World trade indices moved sharply up as monetary guardians forecasted dynamic easing guidelines starting this quarter. Trade volumes across major continental hubs report buoyant demand metrics.`,
      source: 'Bloomberg',
      link: 'https://bloomberg.com',
      imageUrl: 'https://images.unsplash.com/photo-1526304640581-d334cdbbf45e?auto=format&fit=crop&w=600&q=80',
      changePercent: getSeedMetric(0.35, 0.15, 'G1') * getSeedSign('G1'),
      benchmarkLabel: 'MSCI World Index',
    },
    {
      id: 'G2',
      level: 'Global' as HierarchyLevel,
      parentId: null,
      categoryName: 'Global Energy & Materials',
      title: `Global Infrastructure Index Gains on Clean Energy Grants Update for ${dateStr}`,
      summary: `Major energy syndicates announced unified cross-border allocations for offshore grid links. Commodities and transition materials surged, with metals leading trade volumes.`,
      source: 'Financial Times',
      link: 'https://ft.com',
      imageUrl: 'https://images.unsplash.com/photo-1460925895917-afdab827c52f?auto=format&fit=crop&w=600&q=80',
      changePercent: getSeedMetric(0.85, 0.40, 'G2') * getSeedSign('G2'),
      benchmarkLabel: 'S&P Global Clean Energy',
    }
  ];

  // 2. Level: Geography
  const geoStories = [
    {
      id: 'GEO1',
      level: 'Geography' as HierarchyLevel,
      parentId: 'G1',
      categoryName: 'Asia-Pacific',
      title: `APAC Trade Channels Report Double-Digit Hardware Assembly Surge (${dateStr})`,
      summary: `Export pipelines in India, Japan, and Taiwan recorded strong transaction tallies. Government policy supports continue to draw massive localized silicon ecosystem migrations.`,
      source: 'Reuters',
      link: 'https://reuters.com',
      imageUrl: 'https://images.unsplash.com/photo-1444653389962-8149286c578a?auto=format&fit=crop&w=600&q=80',
      changePercent: getSeedMetric(1.15, 0.35, 'GEO1') * getSeedSign('GEO1'),
      benchmarkLabel: 'MSCI AC Asia Pacific',
    },
    {
      id: 'GEO2',
      level: 'Geography' as HierarchyLevel,
      parentId: 'G1',
      categoryName: 'North America',
      title: `North American Technology Capitals Expand Hyperscale Investments (${dateStr})`,
      summary: `Corporate investment strategies fast-track commercial data center constructions. Power grid developers reports record backing for dedicated multi-gigawatt clean projects.`,
      source: 'Bloomberg',
      link: 'https://bloomberg.com',
      imageUrl: 'https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?auto=format&fit=crop&w=600&q=80',
      changePercent: getSeedMetric(0.55, 0.25, 'GEO2') * getSeedSign('GEO2'),
      benchmarkLabel: 'S&P 500',
    },
    {
      id: 'GEO3',
      level: 'Geography' as HierarchyLevel,
      parentId: 'G2',
      categoryName: 'European Union',
      title: `EU Decarbonization Alliances Inject Billions Into Grid Resilience (${dateStr})`,
      summary: `Power supply systems across western continental members receive heavy grants for modernization of high-voltage transmission lines and smart grid networks.`,
      source: 'Financial Times',
      link: 'https://ft.com',
      imageUrl: 'https://images.unsplash.com/photo-1518770660439-4636190af475?auto=format&fit=crop&w=600&q=80',
      changePercent: getSeedMetric(0.65, 0.30, 'GEO3') * getSeedSign('GEO3'),
      benchmarkLabel: 'Euro Stoxx 50',
    },
    {
      id: 'GEO4',
      level: 'Geography' as HierarchyLevel,
      parentId: 'G2',
      categoryName: 'Middle East & Africa',
      title: `Middle Eastern Logistics Corridors Finalize Smart Port Expansions (${dateStr})`,
      summary: `Trade hubs along primary sea lanes launch comprehensive digital ledgers to automate customs clearance, cutting average cargo dwell times by over 40%.`,
      source: 'Reuters',
      link: 'https://reuters.com',
      imageUrl: 'https://images.unsplash.com/photo-1542744094-3a31f103e35f?auto=format&fit=crop&w=600&q=80',
      changePercent: getSeedMetric(1.45, 0.50, 'GEO4') * getSeedSign('GEO4'),
      benchmarkLabel: 'MSCI Arabian Gulf Index',
    }
  ];

  // 3. Level: Country
  const countryStories = [
    {
      id: 'C1',
      level: 'Country' as HierarchyLevel,
      parentId: 'GEO1',
      categoryName: 'India',
      title: `India Production-Linked Incentives Propel Local Industrial Parks (${dateStr})`,
      summary: `New industrial corridors near Mumbai and Chennai secure massive commitments from offshore silicon engineering aggregates, boosting employment projections.`,
      source: 'Economic Times',
      link: 'https://economictimes.indiatimes.com',
      imageUrl: 'https://images.unsplash.com/photo-1532375811409-90d11193060b?auto=format&fit=crop&w=600&q=80',
      changePercent: getSeedMetric(1.45, 0.40, 'C1') * getSeedSign('C1'),
      benchmarkLabel: 'NIFTY 50',
    },
    {
      id: 'C2',
      level: 'Country' as HierarchyLevel,
      parentId: 'GEO1',
      categoryName: 'Japan',
      title: `Japan Advanced Packaging Fabs Double Production Allocations (${dateStr})`,
      summary: `Tokyo trade authorities approve state financial support for next-generation test and packaging facilities to support international high-bandwidth hardware nodes.`,
      source: 'Nikkei Asia',
      link: 'https://nikkei.co.jp',
      imageUrl: 'https://images.unsplash.com/photo-1502920514313-52581002a659?auto=format&fit=crop&w=600&q=80',
      changePercent: getSeedMetric(0.95, 0.35, 'C2') * getSeedSign('C2'),
      benchmarkLabel: 'NIKKEI 225',
    },
    {
      id: 'C3',
      level: 'Country' as HierarchyLevel,
      parentId: 'GEO2',
      categoryName: 'United States',
      title: `US Agencies Distribute Second Major Chips Act Financing Suite (${dateStr})`,
      summary: `Billions in state grants are unlocked for industrial fabrication lines across Oregon, Ohio, and Arizona, accelerating semiconductor supply-chain localization.`,
      source: 'Wall Street Journal',
      link: 'https://wsj.com',
      imageUrl: 'https://images.unsplash.com/photo-1516321318423-f06f85e504b3?auto=format&fit=crop&w=600&q=80',
      changePercent: getSeedMetric(0.55, 0.20, 'C3') * getSeedSign('C3'),
      benchmarkLabel: 'NASDAQ 100',
    },
    {
      id: 'C4',
      level: 'Country' as HierarchyLevel,
      parentId: 'GEO2',
      categoryName: 'Canada',
      title: `Canada AI Alliances Acquire Clean Energy Power Nodes (${dateStr})`,
      summary: `Quebec power regulators approve long-term clean electricity supply contracts for clean supercomputing clusters, ensuring secure operational grid security.`,
      source: 'Globe and Mail',
      link: 'https://globeandmail.com',
      imageUrl: 'https://images.unsplash.com/photo-1558494949-ef010cbdcc31?auto=format&fit=crop&w=600&q=80',
      changePercent: getSeedMetric(0.40, 0.15, 'C4') * getSeedSign('C4'),
      benchmarkLabel: 'S&P/TSX Composite',
    },
    {
      id: 'C5',
      level: 'Country' as HierarchyLevel,
      parentId: 'GEO3',
      categoryName: 'Germany',
      title: `German Electric Vehicle Supply Chains Unify Production Systems (${dateStr})`,
      summary: `Industrial automation specialists across Berlin and Stuttgart establish shared software structures to monitor battery manufacturing quality in real-time.`,
      source: 'Handelsblatt',
      link: 'https://handelsblatt.com',
      imageUrl: 'https://images.unsplash.com/photo-1558494949-ef010cbdcc31?auto=format&fit=crop&w=600&q=80',
      changePercent: getSeedMetric(0.80, 0.30, 'C5') * getSeedSign('C5'),
      benchmarkLabel: 'DAX 40',
    },
    {
      id: 'C6',
      level: 'Country' as HierarchyLevel,
      parentId: 'GEO4',
      categoryName: 'United Arab Emirates',
      title: `UAE National Investment Funds Channel Billions Into AI Clusters (${dateStr})`,
      summary: `Abu Dhabi and Dubai state holding companies approve dedicated investments to finance sovereign advanced supercomputers and digital identity grids.`,
      source: 'Gulf News',
      link: 'https://gulfnews.com',
      imageUrl: 'https://images.unsplash.com/photo-1542744094-3a31f103e35f?auto=format&fit=crop&w=600&q=80',
      changePercent: getSeedMetric(1.55, 0.60, 'C6') * getSeedSign('C6'),
      benchmarkLabel: 'ADX General INDEX',
    }
  ];

  // 4. Level: Sector
  const sectorStories = [
    {
      id: 'Sec1_IT',
      level: 'Sector' as HierarchyLevel,
      parentId: 'C1', // India
      categoryName: 'Technology & Digital IT Services',
      title: `NIFTY IT Index Gathers Strength Amid Tax Clearances for Cloud Exporters (${dateStr})`,
      summary: `Subcontinental software providers receive strong deal inquiries for generative automation integration, platform overhauls, and legacy database migrations.`,
      source: 'Moneycontrol',
      link: 'https://moneycontrol.com',
      imageUrl: 'https://images.unsplash.com/photo-1518770660439-4636190af475?auto=format&fit=crop&w=600&q=80',
      changePercent: getSeedMetric(2.20, 0.50, 'Sec1_IT') * getSeedSign('Sec1_IT'),
      benchmarkLabel: 'NIFTY IT INDEX',
    },
    {
      id: 'Sec1_Banks',
      level: 'Sector' as HierarchyLevel,
      parentId: 'C1', // India
      categoryName: 'Banking & Financials',
      title: `Indian Banking Sector Reports Record Quarterly Credit Book Expansions (${dateStr})`,
      summary: `Top-tier private loan institutions post strong margins as industrial manufacturing demand fuels capital expenditure loan drawdowns across India.`,
      source: 'Financial Express',
      link: 'https://financialexpress.com',
      imageUrl: 'https://images.unsplash.com/photo-1559526324-4b87b5e36e44?auto=format&fit=crop&w=600&q=80',
      changePercent: getSeedMetric(1.65, 0.40, 'Sec1_Banks') * getSeedSign('Sec1_Banks'),
      benchmarkLabel: 'NIFTY BANK INDEX',
    },
    {
      id: 'Sec3_AI',
      level: 'Sector' as HierarchyLevel,
      parentId: 'C3', // US
      categoryName: 'AI hardware & Semis',
      title: `US Silicon Sector Gathers Momentum as GPU Demand Outstrips Supply (${dateStr})`,
      summary: `Market analysts upgrade revenue targets for custom AI acceleration chips, custom logic designers, and high-frequency optical interconnect providers.`,
      source: 'Wall Street Journal',
      link: 'https://wsj.com',
      imageUrl: 'https://images.unsplash.com/photo-1518770660439-4636190af475?auto=format&fit=crop&w=600&q=80',
      changePercent: getSeedMetric(2.55, 0.80, 'Sec3_AI') * getSeedSign('Sec3_AI'),
      benchmarkLabel: 'PHLX Semiconductor Index',
    },
    {
      id: 'Sec3_Cloud',
      level: 'Sector' as HierarchyLevel,
      parentId: 'C3', // US
      categoryName: 'Cloud Infrastructure & Software',
      title: `Corporate Technology Budgets Flow Into Agentic Workflow Integrations (${dateStr})`,
      summary: `US enterprise software providers report strong contract conversions as firms deploy digital assistants to automate high-throughput business logs.`,
      source: 'TechCrunch',
      link: 'https://techcrunch.com',
      imageUrl: 'https://images.unsplash.com/photo-1516321318423-f06f85e504b3?auto=format&fit=crop&w=600&q=80',
      changePercent: getSeedMetric(1.80, 0.45, 'Sec3_Cloud') * getSeedSign('Sec3_Cloud'),
      benchmarkLabel: 'BVP NASDAQ Emerging Cloud',
    },
    {
      id: 'Sec5_Auto',
      level: 'Sector' as HierarchyLevel,
      parentId: 'C5', // Germany
      categoryName: 'Automotive & EV Mobility',
      title: `European Automotive Consortia Announce Joint Solid-State Battery Workgroups (${dateStr})`,
      summary: `Car manufacturers across Stuttgart and Berlin pool investment resources to fast-track regional prototype battery cell lines, seeking import parity.`,
      source: 'Bloomberg',
      link: 'https://bloomberg.com',
      imageUrl: 'https://images.unsplash.com/photo-1558494949-ef010cbdcc31?auto=format&fit=crop&w=600&q=80',
      changePercent: getSeedMetric(-0.45, 0.35, 'Sec5_Auto') * getSeedSign('Sec5_Auto'),
      benchmarkLabel: 'DAX Sector Automobile',
    },
    {
      id: 'Sec7_Trade',
      level: 'Sector' as HierarchyLevel,
      parentId: 'C6', // UAE
      categoryName: 'Trade Logistics & Smart Ports',
      title: `Gulf Trade Gateways Launch Unified Real-Time Tracking Infrastructures (${dateStr})`,
      summary: `Middle Eastern shipping terminals deploy smart tracking sensors across primary routes to provide global clients with instant cargo status reports.`,
      source: 'Reuters',
      link: 'https://reuters.com',
      imageUrl: 'https://images.unsplash.com/photo-1542744094-3a31f103e35f?auto=format&fit=crop&w=600&q=80',
      changePercent: getSeedMetric(1.95, 0.70, 'Sec7_Trade') * getSeedSign('Sec7_Trade'),
      benchmarkLabel: 'Dubai Financial Index',
    }
  ];

  // 5. Level: Industry
  const industryStories = [
    {
      id: 'Ind1_Consult',
      level: 'Industry' as HierarchyLevel,
      parentId: 'Sec1_IT',
      categoryName: 'IT Services & Cloud Consulting',
      title: `Enterprises Accelerate Relocation of Tech Assets to Offshore Locations (${dateStr})`,
      summary: `Global conglomerates increase tech service allocations as consulting agencies shift pricing models toward agentic software completions.`,
      source: 'SaaS Business Daily',
      link: 'https://saasbd.com',
      imageUrl: 'https://images.unsplash.com/photo-1460925895917-afdab827c52f?auto=format&fit=crop&w=600&q=80',
      changePercent: getSeedMetric(2.10, 0.40, 'Ind1_Consult') * getSeedSign('Ind1_Consult'),
      benchmarkLabel: 'NIFTY IT Services Index',
    },
    {
      id: 'Ind1_PrivateBanks',
      level: 'Industry' as HierarchyLevel,
      parentId: 'Sec1_Banks',
      categoryName: 'Private Banking & Wealth Services',
      title: `Subcontinental Wealth Managers Advise Dynamic Allocations to Tech Assets (${dateStr})`,
      summary: `High networth portfolios shift capital into software clusters and chip design houses as regional growth forecasts are upgraded for the year.`,
      source: 'Economic Times',
      link: 'https://economictimes.indiatimes.com',
      imageUrl: 'https://images.unsplash.com/photo-1559526324-4b87b5e36e44?auto=format&fit=crop&w=600&q=80',
      changePercent: getSeedMetric(1.85, 0.35, 'Ind1_PrivateBanks') * getSeedSign('Ind1_PrivateBanks'),
      benchmarkLabel: 'Private Banks Sector',
    },
    {
      id: 'Ind3_GPU',
      level: 'Industry' as HierarchyLevel,
      parentId: 'Sec3_AI',
      categoryName: 'Semiconductor Chips & GPU design',
      title: `Semiconductor Designers Focus on Advanced Thermal Packaging Tooling (${dateStr})`,
      summary: `As power requirements surge in supercomputing nodes, silicon design houses are partnering with packaging specialists to design heat dissipation structures.`,
      source: 'Semicon Today',
      link: 'https://semitoday.com',
      imageUrl: 'https://images.unsplash.com/photo-1518770660439-4636190af475?auto=format&fit=crop&w=600&q=80',
      changePercent: getSeedMetric(2.85, 0.90, 'Ind3_GPU') * getSeedSign('Ind3_GPU'),
      benchmarkLabel: 'NVIDIA GPU Ecosystem Index',
    },
    {
      id: 'Ind3_SaaS',
      level: 'Industry' as HierarchyLevel,
      parentId: 'Sec3_Cloud',
      categoryName: 'Enterprise SaaS Platforms',
      title: `Cloud Exporters Experience Multi-Year Subscription Expansions (${dateStr})`,
      summary: `High conversion velocities are reported for software suites offering automated customer relations solutions and modern API endpoints.`,
      source: 'Wired',
      link: 'https://wired.com',
      imageUrl: 'https://images.unsplash.com/photo-1516321318423-f06f85e504b3?auto=format&fit=crop&w=600&q=80',
      changePercent: getSeedMetric(1.90, 0.45, 'Ind3_SaaS') * getSeedSign('Ind3_SaaS'),
      benchmarkLabel: 'Global Enterprise SaaS Index',
    },
    {
      id: 'Ind5_Mobility',
      level: 'Industry' as HierarchyLevel,
      parentId: 'Sec5_Auto',
      categoryName: 'Next-Gen Electric Vehicle Batteries',
      title: `EV Manufacturing Plants Configure Solid-Battery Test Lines (${dateStr})`,
      summary: `Technologists report successful test runs on silicon anode battery modules, promising significant vehicle range increases under extreme climates.`,
      source: 'Wired',
      link: 'https://wired.com',
      imageUrl: 'https://images.unsplash.com/photo-1558494949-ef010cbdcc31?auto=format&fit=crop&w=600&q=80',
      changePercent: getSeedMetric(-0.80, 0.40, 'Ind5_Mobility') * getSeedSign('Ind5_Mobility'),
      benchmarkLabel: 'Global EV Metals Index',
    },
    {
      id: 'Ind7_Freight',
      level: 'Industry' as HierarchyLevel,
      parentId: 'Sec7_Trade',
      categoryName: 'Sea Port Logistics & Cargo Hubs',
      title: `Freight Shipping Corridors Deploy AI Automated Customs Ledgers (${dateStr})`,
      summary: `Primary sea link terminals implement smart cargo ledger tracking systems, leading to lower dwell times and improved logistics predictability.`,
      source: 'Bloomberg',
      link: 'https://bloomberg.com',
      imageUrl: 'https://images.unsplash.com/photo-1542744094-3a31f103e35f?auto=format&fit=crop&w=600&q=80',
      changePercent: getSeedMetric(2.05, 0.60, 'Ind7_Freight') * getSeedSign('Ind7_Freight'),
      benchmarkLabel: 'Global Shipping Rate Index',
    }
  ];

  // 6. Level: Stocks (Total 51 stocks across the 6 industries)
  // Let's programmatically generate 51 unique stocks.
  const stockTickers = [
    // Ind1_Consult (IT Services & Consulting) - 10 stocks
    { ticker: 'INFY', name: 'Infosys Corp', ind: 'Ind1_Consult', base: 2.10, var: 1.20, summary: 'rebounded as the firm signed a mammoth digital transformation deal with a major financial institution.' },
    { ticker: 'TCS', name: 'Tata Consultancy Services', ind: 'Ind1_Consult', base: 1.65, var: 0.90, summary: 'secured a cloud migration order from a premier EU cooperative insurance syndicate.' },
    { ticker: 'WIPRO', name: 'Wipro Ltd', ind: 'Ind1_Consult', base: 1.25, var: 0.85, summary: 'announced partnership deals with cloud infrastructure leaders to secure enterprise databases.' },
    { ticker: 'LTIM', name: 'LTIMindtree Ltd', ind: 'Ind1_Consult', base: 2.45, var: 1.50, summary: 'expanded software consulting agreements with major retail groups across North America.' },
    { ticker: 'COFORGE', name: 'Coforge Ltd', ind: 'Ind1_Consult', base: 3.10, var: 1.95, summary: 'posted improved revenue guidance following high credit conversion of software delivery logs.' },
    { ticker: 'SAKSOFT', name: 'Saksoft Ltd', ind: 'Ind1_Consult', base: 4.55, var: 2.50, summary: 'touched historic limits after closing a key European cloud asset acquisition.' },
    { ticker: 'KELLTONTEC', name: 'Kellton Tech Solutions', ind: 'Ind1_Consult', base: 5.20, var: 2.80, summary: 'secured comprehensive smart city digital integration projects in Middle Eastern sectors.' },
    { ticker: 'TECHM', name: 'Tech Mahindra', ind: 'Ind1_Consult', base: 1.50, var: 1.10, summary: 'collaborated on telecommunication infrastructure software with top global operators.' },
    { ticker: 'HCLT', name: 'HCL Technologies', ind: 'Ind1_Consult', base: 1.90, var: 1.30, summary: 'won long-term silicon design tool support contracts with top hardware fabrication clients.' },
    { ticker: 'MPHASIS', name: 'Mphasis Ltd', ind: 'Ind1_Consult', base: 2.20, var: 1.60, summary: 'reports strong demand for transaction automations and credit ledger software platforms.' },

    // Ind1_PrivateBanks (Banking & Credit) - 8 stocks
    { ticker: 'HDFCBANK', name: 'HDFC Bank Ltd', ind: 'Ind1_PrivateBanks', base: 1.95, var: 0.80, summary: 'announced record deposit accruals and low leverage ratios, supporting credit growth.' },
    { ticker: 'ICICIBANK', name: 'ICICI Bank Ltd', ind: 'Ind1_PrivateBanks', base: 2.40, var: 1.10, summary: 'posted strong net interest margins, outperforming consensus street expectations.' },
    { ticker: 'SBIN', name: 'State Bank of India', ind: 'Ind1_PrivateBanks', base: 1.20, var: 1.30, summary: 'won state infrastructure loan mandates, leading to massive portfolio expansions.' },
    { ticker: 'PAYTM', name: 'One97 Communications (Paytm)', ind: 'Ind1_PrivateBanks', base: -3.40, var: 4.20, summary: 'faced scrutiny over regulatory sandbox filings, but launched new payment devices.' },
    { ticker: 'JPM', name: 'JPMorgan Chase & Co', ind: 'Ind1_PrivateBanks', base: 1.10, var: 0.50, summary: 'integrated custom risk models across asset services, boosting consulting efficiency.' },
    { ticker: 'MS', name: 'Morgan Stanley', ind: 'Ind1_PrivateBanks', base: 1.45, var: 0.70, summary: 'disclosed high capital buffers and record wealth management net collections.' },
    { ticker: 'GS', name: 'Goldman Sachs Group', ind: 'Ind1_PrivateBanks', base: 0.90, var: 0.80, summary: 'expanded institutional financing portfolios matching infrastructure development projects.' },
    { ticker: 'RELIANCE', name: 'Reliance Industries', ind: 'Ind1_PrivateBanks', base: 1.30, var: 0.75, summary: 'invested in massive physical fiber expansions and next-gen retail ledger setups.' },

    // Ind3_GPU (GPUs and semiconductors) - 9 stocks
    { ticker: 'NVDA', name: 'NVIDIA Corp', ind: 'Ind3_GPU', base: 3.85, var: 2.50, summary: 'surged following upgraded demand guidance for next-gen high-density tensor chips.' },
    { ticker: 'AMD', name: 'Advanced Micro Devices', ind: 'Ind3_GPU', base: 2.15, var: 1.90, summary: 'announced custom software layers to streamline server workloads on modern GPU cores.' },
    { ticker: 'INTC', name: 'Intel Corp', ind: 'Ind3_GPU', base: -1.40, var: 2.10, summary: 'disclosed fabrication park build adjustments, but won multi-billion foundry orders.' },
    { ticker: 'TSM', name: 'Taiwan Semiconductor Mfg', ind: 'Ind3_GPU', base: 2.80, var: 1.40, summary: 'reported record packaging yields, with fabs breaking ground in Arizona and Japan.' },
    { ticker: 'ASML', name: 'ASML Holding NV', ind: 'Ind3_GPU', base: 1.95, var: 1.20, summary: 'shipped advanced EUV lithography systems to premier North American fabrication centers.' },
    { ticker: 'AVGO', name: 'Broadcom Inc', ind: 'Ind3_GPU', base: 2.40, var: 1.60, summary: 'finalized custom optical interlink delivery contracts with top deep learning networks.' },
    { ticker: 'QCOM', name: 'Qualcomm Inc', ind: 'Ind3_GPU', base: 1.50, var: 1.10, summary: 'unveiled next-generation on-device machine learning chipsets for premium mobile handsets.' },
    { ticker: 'MU', name: 'Micron Technology Inc', ind: 'Ind3_GPU', base: 3.10, var: 2.20, summary: 'guided high prices for high-bandwidth memory modules, driving wafer storage demand.' },
    { ticker: 'ARM', name: 'ARM Holdings plc', ind: 'Ind3_GPU', base: 4.10, var: 2.90, summary: 'reported record royalties as mobile and hyperscale server architectures shift to ARM designs.' },

    // Ind3_SaaS (Enterprise software) - 8 stocks
    { ticker: 'MSFT', name: 'Microsoft Corp', ind: 'Ind3_SaaS', base: 1.15, var: 0.50, summary: 'announced deep system-level integrations of agentic copilots across its software suite.' },
    { ticker: 'AAPL', name: 'Apple Inc', ind: 'Ind3_SaaS', base: 0.80, var: 0.65, summary: 'disclosed next-gen private cloud clusters to process high-throughput device inquiries.' },
    { ticker: 'AMZN', name: 'Amazon.com Inc', ind: 'Ind3_SaaS', base: 1.35, var: 0.70, summary: 'reports strong cloud storage additions and updated smart retail sorting systems.' },
    { ticker: 'GOOGL', name: 'Alphabet Inc', ind: 'Ind3_SaaS', base: 1.55, var: 0.85, summary: 'expanded search grounding algorithms with real-time news syndications for enterprises.' },
    { ticker: 'SAP', name: 'SAP SE', ind: 'Ind3_SaaS', base: 1.25, var: 0.75, summary: 'onboarded top automotive syndicates to utilize their unified supply chain log ledgers.' },
    { ticker: 'KPIT', name: 'KPIT Technologies', ind: 'Ind3_SaaS', base: 2.95, var: 1.80, summary: 'clinched major software-defined vehicle orders from standard European commercial brands.' },
    { ticker: 'PERSISTENT', name: 'Persistent Systems Ltd', ind: 'Ind3_SaaS', base: 3.20, var: 1.90, summary: 'surged after expanding digital engineering contracts with APAC retail aggregates.' },
    { ticker: 'Coforge', name: 'Coforge Systems', ind: 'Ind3_SaaS', base: 2.85, var: 1.70, summary: 'disclosed high contract visibility following platform system updates with bank partners.' },

    // Ind5_Mobility (EV and battery tech) - 8 stocks
    { ticker: 'TSLA', name: 'Tesla Inc', ind: 'Ind5_Mobility', base: 1.40, var: 2.20, summary: 'showcased upgraded full-self-driving simulations, attracting institutional backing.' },
    { ticker: 'BYD', name: 'BYD Company Ltd', ind: 'Ind5_Mobility', base: 2.10, var: 1.85, summary: 'reported record vehicle export totals, dominating APAC electrical corridors.' },
    { ticker: 'RIVN', name: 'Rivian Automotive', ind: 'Ind5_Mobility', base: -2.50, var: 3.40, summary: 'faced battery terminal bottlenecks, but confirmed stable joint venture investments.' },
    { ticker: 'LCID', name: 'Lucid Group Inc', ind: 'Ind5_Mobility', base: -3.10, var: 4.15, summary: 'announced capital raising plans, backed securely by sovereign wealth resources.' },
    { ticker: 'NIO', name: 'Nio Inc', ind: 'Ind5_Mobility', base: -1.85, var: 3.10, summary: 'expanded battery-swapping networks across mainland hubs, decreasing grid wait times.' },
    { ticker: 'LI', name: 'Li Auto Inc', ind: 'Ind5_Mobility', base: 1.95, var: 1.65, summary: 'reported positive margin returns as extended-range family models gain top tier ranks.' },
    { ticker: 'TATAMOTORS', name: 'Tata Motors Ltd', ind: 'Ind5_Mobility', base: 2.30, var: 1.40, summary: 'announced dedicated electric vehicle line spin-offs to unlock focused investment channels.' },
    { ticker: 'TSM_CHIP', name: 'TSM Power Systems', ind: 'Ind5_Mobility', base: 1.15, var: 0.95, summary: 'launched custom high-voltage logic units for heavy industrial battery management.' },

    // Ind7_Freight (Ports & Logistics) - 8 stocks
    { ticker: 'DPW', name: 'DP World (Dubai)', ind: 'Ind7_Freight', base: 1.75, var: 0.90, summary: 'streamlined sea terminal container sorting, cutting custom clearance by 6 hours.' },
    { ticker: 'PORT', name: 'Abu Dhabi Ports', ind: 'Ind7_Freight', base: 2.10, var: 1.05, summary: 'reported record container volumes, handling high trade traffic from APAC channels.' },
    { ticker: 'SHIP', name: 'Gulf Transporters', ind: 'Ind7_Freight', base: 1.25, var: 1.15, summary: 'deployed hybrid cargo fleets to bypass transit bottlenecks, boosting fuel efficiency.' },
    { ticker: 'LOGI', name: 'Smart Logistics UAE', ind: 'Ind7_Freight', base: 2.45, var: 1.40, summary: 'launched automated documentation ledgers, attracting top tier commercial packers.' },
    { ticker: 'KLINE', name: 'K Line Logistics', ind: 'Ind7_Freight', base: 1.30, var: 0.85, summary: 'configured bulk logistics corridors to deliver silicon raw materials to packaging centers.' },
    { ticker: 'SovereignPorts', name: 'Sovereign Ports Holding', ind: 'Ind7_Freight', base: 1.90, var: 0.95, summary: 'opened a fresh regional smart city industrial gateway, with zero custom bottlenecks.' },
    { ticker: 'APM', name: 'APM Terminals', ind: 'Ind7_Freight', base: 1.60, var: 0.70, summary: 'finalized electric forklift acquisitions to reduce total carbon loads in European harbors.' },
    { ticker: 'AD_PORT', name: 'Adani Ports SEZ', ind: 'Ind7_Freight', base: 2.50, var: 1.55, summary: 'gained smart cargo mandates to establish automated container corridors in east Africa.' }
  ];

  const stockStories = stockTickers.map((s, idx) => {
    const change = getSeedMetric(s.base, s.var, s.ticker) * getSeedSign(s.ticker);
    return {
      id: s.ticker,
      level: 'Stock' as HierarchyLevel,
      parentId: s.ind,
      categoryName: s.name,
      title: `${s.ticker} ${change >= 0 ? 'Surges' : 'Diplines'} on ${dateStr} Following Key Segment Update`,
      summary: `Shares of ${s.name} (${s.ticker}) changed ${change}% today. The stock ${s.summary} Financial analysts maintain strong ratings as trading volume remains high.`,
      source: idx % 2 === 0 ? 'Moneycontrol' : 'Bloomberg',
      link: idx % 2 === 0 ? 'https://moneycontrol.com' : 'https://bloomberg.com',
      imageUrl: idx % 3 === 0 
        ? 'https://images.unsplash.com/photo-1542744094-3a31f103e35f?auto=format&fit=crop&w=600&q=80'
        : idx % 3 === 1 
          ? 'https://images.unsplash.com/photo-1590283603385-17ffb3a7f29f?auto=format&fit=crop&w=600&q=80'
          : 'https://images.unsplash.com/photo-1611974789855-9c2a0a7236a3?auto=format&fit=crop&w=600&q=80',
      changePercent: change,
      benchmarkLabel: s.ticker,
      capGroup: getCapGroup(s.ticker) as any
    };
  });

  const allStories = [
    ...globalStories,
    ...geoStories,
    ...countryStories,
    ...sectorStories,
    ...industryStories,
    ...stockStories
  ];

  return allStories.map(story => ({
    ...story,
    date: dateStr
  })) as NewsItem[];
}
