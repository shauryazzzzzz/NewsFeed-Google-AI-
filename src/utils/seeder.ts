import { NewsItem, HierarchyLevel } from '../types';

/**
 * Generate 500+ high-quality procedurally randomized financial daily hierarchy news items
 * spanning the last 7 days from the specified baseline date.
 */
export function generateLastWeek500News(baselineDateStr: string): NewsItem[] {
  const result: NewsItem[] = [];
  
  // Calculate the last 7 dates
  const dates: string[] = [];
  const baseDate = new Date(baselineDateStr);
  
  for (let i = 0; i < 7; i++) {
    const d = new Date(baseDate);
    d.setDate(baseDate.getDate() - i);
    const yyyy = d.getFullYear();
    const mm = String(d.getMonth() + 1).padStart(2, '0');
    const dd = String(d.getDate()).padStart(2, '0');
    dates.push(`${yyyy}-${mm}-${dd}`);
  }

  // Template words for variety
  const globalEvents = [
    { cat: 'Macro Inflation', base: 'Global Bonds Yield Surge as Core Inflation prints Higher' },
    { cat: 'Monetary Policy', base: 'Federal Reserve Signals Higher-for-Longer Interest Rate Corridor' },
    { cat: 'OPEC Energy', base: 'OPEC+ Agrees to Extended Oil Production Cuts into Next Quarter' },
    { cat: 'Supply Chain', base: 'Red Sea Congestions Prompt Global Air freight Supply Chain Pivot' },
    { cat: 'Liquidity Squeeze', base: 'Global Liquidity Registers Sharp Underflow Amid Sovereign Debt Tightening' },
    { cat: 'S&P Outlook', base: 'Corporate Credit Default Swaps Hit Multi-Year Highs in Debt Markets' },
    { cat: 'Trade Policies', base: 'Tariff Tensions Flare Between EU and Major Automotive Exporters' }
  ];

  const geographicalMarkets = [
    { cat: 'United States', title: 'Wall Street Futures Slide Under Treasury Yield Pressure', source: 'Bloomberg', benchmark: 'S&P 500' },
    { cat: 'Eurozone', title: 'European Core Manufacturing Activity Hits 6-Month Sector Consolidation', source: 'Reuters', benchmark: 'DAX 40' },
    { cat: 'Asia-Pacific', title: 'APAC Semiconductor Hubs Post Double-Digit Lead in Exports', source: 'Nikkei', benchmark: 'Nikkei 225' },
    { cat: 'India Economy', title: 'Indian Services PMI Highlights Continued Long-Term Capital Inflow', source: 'Economic Times', benchmark: 'NIFTY 50' }
  ];

  const industryVerticals = [
    { cat: 'IT Services', title: 'Indian IT Services Subcontracting Bills Slump Amid AI-Automation Substitution', parentGeo: 'India Economy' },
    { cat: 'Banking & BFSI', title: 'BFSI Segment Posts Record Deposit Accruals Supported by Retail Savings', parentGeo: 'India Economy' },
    { cat: 'Automotive Electric', title: 'Electric Vehicle Suppliers Negotiate Premium Battery Metals Contracts', parentGeo: 'Asia-Pacific' },
    { cat: 'Pharma & Biotech', title: 'Generic Exporters Profit on Expanded FDA Abbreviated Drug Licenses', parentGeo: 'India Economy' }
  ];

  // List of major stocks to simulate heavily (Large, Mid, Small Cap)
  const stockPortfolios = [
    // Large Cap
    { name: 'TCS', code: 'TCS', cap: 'Large' as const, industry: 'IT Services', url: 'https://images.unsplash.com/photo-1516321318423-f06f85e504b3?auto=format&fit=crop&w=400&q=80' },
    { name: 'Infosys', code: 'INFY', cap: 'Large' as const, industry: 'IT Services', url: 'https://images.unsplash.com/photo-1551288049-bebda4e38f71?auto=format&fit=crop&w=400&q=80' },
    { name: 'Wipro', code: 'WIPRO', cap: 'Large' as const, industry: 'IT Services', url: 'https://images.unsplash.com/photo-1460925895917-afdab827c52f?auto=format&fit=crop&w=400&q=80' },
    { name: 'Reliance Industries', code: 'RELIANCE', cap: 'Large' as const, industry: 'Banking & BFSI', url: 'https://images.unsplash.com/photo-1526304640581-d334cdbbf45e?auto=format&fit=crop&w=400&q=80' },
    { name: 'State Bank of India', code: 'SBIN', cap: 'Large' as const, industry: 'Banking & BFSI', url: 'https://images.unsplash.com/photo-1502920514313-52581002a659?auto=format&fit=crop&w=400&q=80' },
    { name: 'HDFC Bank', code: 'HDFCBANK', cap: 'Large' as const, industry: 'Banking & BFSI', url: 'https://images.unsplash.com/photo-1559526324-4b87b5e36e44?auto=format&fit=crop&w=400&q=80' },
    
    // Mid Cap
    { name: 'LTI Mindtree', code: 'LTIM', cap: 'Mid' as const, industry: 'IT Services', url: 'https://images.unsplash.com/photo-1454165804606-c3d57bc86b40?auto=format&fit=crop&w=400&q=80' },
    { name: 'Coforge', code: 'COFORGE', cap: 'Mid' as const, industry: 'IT Services', url: 'https://images.unsplash.com/photo-1504384308090-c894fdcc538d?auto=format&fit=crop&w=400&q=80' },
    { name: 'Tata Motors', code: 'TATAMOTORS', cap: 'Mid' as const, industry: 'Automotive Electric', url: 'https://images.unsplash.com/photo-1563986768609-322da13575f3?auto=format&fit=crop&w=400&q=80' },
    { name: 'Federal Bank', code: 'FEDERALBNK', cap: 'Mid' as const, industry: 'Banking & BFSI', url: 'https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?auto=format&fit=crop&w=400&q=80' },
    
    // Small Cap
    { name: 'Saksoft Ltd', code: 'SAKSOFT', cap: 'Small' as const, industry: 'IT Services', url: 'https://images.unsplash.com/photo-1542744094-3a31f103e35f?auto=format&fit=crop&w=400&q=80' },
    { name: 'Kellton Tech', code: 'KELLTONTEC', cap: 'Small' as const, industry: 'IT Services', url: 'https://images.unsplash.com/photo-1519389950473-47ba0277781c?auto=format&fit=crop&w=400&q=80' },
    { name: 'Tata Elxsi', code: 'TATAELXSI', cap: 'Small' as const, industry: 'Automotive Electric', url: 'https://images.unsplash.com/photo-1488590528505-98d2b5aba04b?auto=format&fit=crop&w=400&q=80' },
    { name: 'Marksans Pharma', code: 'MARKSANS', cap: 'Small' as const, industry: 'Pharma & Biotech', url: 'https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?auto=format&fit=crop&w=400&q=80' }
  ];

  const stockActionVerbs = [
    { verb: 'Surges', flow: 'on record high revenue volumes following automated solutions delivery', direction: 1 },
    { verb: 'Consolidates', flow: 'as foreign portfolio investors reallocate sector weights in favor of energy assets', direction: 0 },
    { verb: 'Retreats', flow: 'following conservative forward margins projections under inflationary contract renewals', direction: -1 },
    { verb: 'Outperforms', flow: 'after declaring a multi-year IT integration partnership with digital financial houses', direction: 1 },
    { verb: 'Ticks Higher', flow: 'following regulatory approvals for overseas cloud infrastructure service expansions', direction: 1 },
    { verb: 'Slips', flow: 'due to sub-contractor supply challenges and minor labor inflation offsets', direction: -1 }
  ];

  // For each of the 7 days:
  dates.forEach((dateStr, dayIdx) => {
    const daySeed = dayIdx * 10;
    
    // 1. Generate 2 Global events per day
    const glob1Idx = (daySeed) % globalEvents.length;
    const glob2Idx = (daySeed + 3) % globalEvents.length;
    
    const glob1: NewsItem = {
      id: `${dateStr}-G1`,
      level: 'Global',
      parentId: null,
      categoryName: globalEvents[glob1Idx].cat,
      title: `${globalEvents[glob1Idx].base} [HCD-${dateStr}]`,
      summary: `On ${dateStr}, macro analysts reported rapid shifting dynamics. World equity boards experienced massive capital flows matching baseline developments. Premier institutions remain on standby.`,
      source: 'Bloomberg News',
      link: 'https://bloomberg.com',
      imageUrl: 'https://images.unsplash.com/photo-1526304640581-d334cdbbf45e?auto=format&fit=crop&w=600&q=80',
      date: dateStr,
      changePercent: Number((0.1 + (dayIdx * 0.12)).toFixed(2)),
      benchmarkLabel: 'MSCI World index'
    };

    const glob2: NewsItem = {
      id: `${dateStr}-G2`,
      level: 'Global',
      parentId: null,
      categoryName: globalEvents[glob2Idx].cat,
      title: `${globalEvents[glob2Idx].base} - Secondary Market Rebalancing`,
      summary: `A parallel developments stream on ${dateStr} highlights credit stress metrics. Investment hedges accelerated into safe-haven precious metals, altering baseline models.`,
      source: 'Wall Street Journal',
      link: 'https://wsj.com',
      imageUrl: 'https://images.unsplash.com/photo-1611974789855-9c2a0a7236a3?auto=format&fit=crop&w=600&q=80',
      date: dateStr,
      changePercent: Number((-0.15 - (dayIdx * 0.08)).toFixed(2)),
      benchmarkLabel: 'S&P Rating Agency'
    };

    result.push(glob1, glob2);

    // 2. Generate 4 Geographies per day (2 parented to G1, 2 parented to G2)
    const geos: NewsItem[] = [];
    geographicalMarkets.forEach((geo, geoIdx) => {
      const parentId = geoIdx < 2 ? glob1.id : glob2.id;
      const changeFloat = Number(((geoIdx % 2 === 0 ? 0.35 : -0.22) * (dayIdx + 1)).toFixed(2));
      
      const geoCard: NewsItem = {
        id: `${dateStr}-GEO-${geoIdx}`,
        level: 'Geography',
        parentId: parentId,
        categoryName: geo.cat,
        title: `${geo.title} [Vol-${100 + dayIdx * 5}]`,
        summary: `Local regional indicators recorded on ${dateStr} display divergence. Asset reallocation flows favored tech segments over industrial counterparts in modern trade channels.`,
        source: geo.source,
        link: 'https://reuters.com',
        imageUrl: 'https://images.unsplash.com/photo-1444653389962-8149286c578a?auto=format&fit=crop&w=600&q=80',
        date: dateStr,
        changePercent: changeFloat,
        benchmarkLabel: geo.benchmark
      };
      
      geos.push(geoCard);
      result.push(geoCard);
    });

    // 3. Generate 8 Industries per day (2 parented to each Geography)
    const industries: NewsItem[] = [];
    industryVerticals.forEach((ind, indIdx) => {
      // Create 2 duplicates for each category with slight variations to hit higher counts
      for (let dup = 1; dup <= 2; dup++) {
        // Map to corresponding Geography card (0, 1, 2, or 3)
        const geoParentIdx = indIdx; // Maps neatly
        const geoParent = geos[geoParentIdx];
        const changeFloat = Number((((indIdx % 2 === 0 ? 0.6 : -0.45) * dup) + (dayIdx * 0.1)).toFixed(2));

        const indCard: NewsItem = {
          id: `${dateStr}-IND-${indIdx}-D${dup}`,
          level: 'Industry',
          parentId: geoParent.id,
          categoryName: ind.cat,
          title: `${ind.cat} - ${ind.title} (Batch-${dup})`,
          summary: `Our on-the-ground sector analytics for ${dateStr} points to structural realignments. Companies utilizing cloud automation frameworks are outstripping brick-and-mortar setups.`,
          source: 'Economic Times',
          imageUrl: 'https://images.unsplash.com/photo-1460925895917-afdab827c52f?auto=format&fit=crop&w=400&q=80',
          date: dateStr,
          changePercent: changeFloat,
          benchmarkLabel: `${ind.cat} Index`
        };

        industries.push(indCard);
        result.push(indCard);
      }
    });

    // 4. Generate 60 Stocks per day under these Industries to hit ~72 cards per day
    // This gives: 2 (Global) + 4 (Geographies) + 8 (Industries) + 60 (Stocks) = 74 news stories per day!
    // Over 7 days: 74 * 7 = 518 news stories total!
    for (let stockLoop = 0; stockLoop < 60; stockLoop++) {
      // Pick a portfolio template
      const portfolioIdx = (daySeed + stockLoop) % stockPortfolios.length;
      const portfolio = stockPortfolios[portfolioIdx];
      
      // Select appropriate Indus parent matching portfolio.industry
      const parentInd = industries.find(ind => ind.categoryName === portfolio.industry) || industries[0];
      
      // Select action verb for Title
      const verbIdx = (daySeed + stockLoop * 2) % stockActionVerbs.length;
      const verbObj = stockActionVerbs[verbIdx];
      
      // Calculate Change %
      const baseChange = verbObj.direction === 1 ? 1.5 : (verbObj.direction === -1 ? -1.2 : 0.1);
      const randomNoise = Number(((stockLoop * 0.05) - (dayIdx * 0.03)).toFixed(2));
      const changeFloat = Number((baseChange + randomNoise).toFixed(2));

      const stockCard: NewsItem = {
        id: `${dateStr}-ST-${stockLoop}`,
        level: 'Stock',
        parentId: parentInd.id,
        categoryName: portfolio.name,
        title: `${portfolio.name} shares ${verbObj.verb} ${changeFloat > 0 ? '+' : ''}${changeFloat}% in ${portfolio.industry} trading`,
        summary: `${portfolio.name} (${portfolio.code}) ${verbObj.flow} on ${dateStr}. Capital advisors reported increased trading velocity as institutional desks re-balanced high-yield portfolios.`,
        source: 'Moneycontrol',
        link: 'https://moneycontrol.com',
        imageUrl: portfolio.url,
        date: dateStr,
        changePercent: changeFloat,
        benchmarkLabel: portfolio.code,
        capGroup: portfolio.cap
      };

      result.push(stockCard);
    }
  });

  return result;
}
