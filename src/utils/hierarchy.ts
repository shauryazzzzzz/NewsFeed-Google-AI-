import { NewsItem, HierarchyLevel, HIERARCHY_ORDER } from '../types';

/**
 * Traverses recursively upwards from a news item to compile its breadcrumb history trail.
 */
export function getBreadcrumbs(item: NewsItem, allItems: NewsItem[]): string[] {
  const crumbs: string[] = [item.categoryName];
  let current = item;

  // Prevent infinite loops in case of broken cyclic parents
  const visited = new Set<string>([item.id]);

  while (current.parentId) {
    const parent = allItems.find(x => x.id === current.parentId);
    if (!parent || visited.has(parent.id)) break;
    
    crumbs.unshift(parent.categoryName);
    visited.add(parent.id);
    current = parent;
  }

  return crumbs;
}

/**
 * Finds all sibling nodes belonging to the same parent at the same level as the active item.
 */
export function getSiblingNodes(item: NewsItem, allItems: NewsItem[]): NewsItem[] {
  return allItems.filter(
    x => x.level === item.level && x.parentId === item.parentId
  );
}

/**
 * Finds child nodes immediately below the specified item in the hierarchy.
 */
export function getChildNodes(item: NewsItem, allItems: NewsItem[]): NewsItem[] {
  return allItems.filter(x => x.parentId === item.id);
}

/**
 * Finds the parent node of the specified item in the hierarchy.
 */
export function getParentNode(item: NewsItem, allItems: NewsItem[]): NewsItem | null {
  if (!item.parentId) return null;
  return allItems.find(x => x.id === item.parentId) || null;
}
