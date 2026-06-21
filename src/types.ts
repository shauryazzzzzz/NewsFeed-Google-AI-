export type HierarchyLevel = 'Global' | 'Geography' | 'Country' | 'Sector' | 'Industry' | 'Stock';

export const HIERARCHY_ORDER: HierarchyLevel[] = [
  'Global',
  'Geography',
  'Country',
  'Sector',
  'Industry',
  'Stock'
];

export interface NewsItem {
  id: string;
  level: HierarchyLevel;
  parentId: string | null;
  categoryName: string;
  title: string;
  summary: string;
  source: string;
  link?: string;
  imageUrl?: string;
  date: string; // YYYY-MM-DD
  changePercent?: number; // associated daily change % (e.g. +1.45%, -0.8%)
  benchmarkLabel?: string; // associated asset or tracker name (e.g., "NIFTY 50", "USD/INR", "NVDA", "GDP Basis")
  capGroup?: 'Large' | 'Mid' | 'Small'; // India IT Stock sub-hierarchical level
}

export interface SpreadsheetInfo {
  id: string;
  title: string;
  tabs: string[];
}
