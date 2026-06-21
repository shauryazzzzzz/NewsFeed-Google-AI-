import { NewsItem, HierarchyLevel, HIERARCHY_ORDER } from '../types';

export interface MindMapNode {
  id: string;
  item: NewsItem;
  x: number;
  y: number;
  levelIndex: number;
  childrenIds: string[];
}

export interface MindMapLink {
  id: string;
  sourceId: string;
  targetId: string;
  pathData: string;
}

export function layoutHierarchicalNews(
  items: NewsItem[],
  width: number = 1000,
  height: number = 600
): { nodes: MindMapNode[]; links: MindMapLink[]; width: number; height: number } {
  if (items.length === 0) {
    return { nodes: [], links: [], width, height };
  }

  // Create lookup maps
  const nodeMap = new Map<string, NewsItem>();
  const childrenMap = new Map<string, string[]>();

  items.forEach(item => {
    nodeMap.set(item.id, item);
    if (item.parentId) {
      const children = childrenMap.get(item.parentId) || [];
      children.push(item.id);
      childrenMap.set(item.parentId, children);
    }
  });

  // Find roots (Global level items, or items with missing/invalid parents)
  const roots = items.filter(item => {
    if (item.level === 'Global') return true;
    if (!item.parentId) return true;
    // or if the parent is not present in our items list
    return !nodeMap.has(item.parentId);
  });

  // Level index helper
  const getLevelIndex = (level: HierarchyLevel): number => {
    const idx = HIERARCHY_ORDER.indexOf(level);
    return idx === -1 ? 0 : idx;
  };

  // Build temporary tree
  interface TempNode {
    id: string;
    item: NewsItem;
    children: TempNode[];
    levelIndex: number;
    y: number;
  }

  const buildSubtree = (item: NewsItem): TempNode => {
    const childrenIds = childrenMap.get(item.id) || [];
    const children = childrenIds
      .map(cid => nodeMap.get(cid)!)
      .filter(Boolean)
      .map(buildSubtree);
    
    return {
      id: item.id,
      item,
      children,
      levelIndex: getLevelIndex(item.level),
      y: 0
    };
  };

  const tempRoots = roots.map(buildSubtree);

  // Layout Leaf spacing
  let leafCount = 0;
  const leaves: TempNode[] = [];

  const assignLeavesY = (node: TempNode) => {
    if (node.children.length === 0) {
      node.y = leafCount;
      leaves.push(node);
      leafCount++;
    } else {
      node.children.forEach(assignLeavesY);
      // center parent between first and last child
      const firstY = node.children[0].y;
      const lastY = node.children[node.children.length - 1].y;
      node.y = (firstY + lastY) / 2;
    }
  };

  tempRoots.forEach(assignLeavesY);

  // If no leaves (fallback), assign sequentially
  if (leafCount === 0) {
    let count = 0;
    const walk = (node: TempNode) => {
      node.y = count++;
      node.children.forEach(walk);
    };
    tempRoots.forEach(walk);
    leafCount = count;
  }

  // Calculate coordinates
  // X columns: 6 columns
  const numColumns = HIERARCHY_ORDER.length;
  const paddingX = 80;
  const colWidth = (width - paddingX * 2) / Math.max(1, numColumns - 1);

  const paddingY = 60;
  const calculatedHeight = Math.max(height, leafCount * 110 + paddingY * 2);
  const rowHeight = (calculatedHeight - paddingY * 2) / Math.max(1, leafCount - 1 || 1);

  const flatNodes: MindMapNode[] = [];
  const flatLinks: MindMapLink[] = [];

  const fillCoordinates = (node: TempNode) => {
    const x = paddingX + node.levelIndex * colWidth;
    const y = paddingY + node.y * rowHeight;

    flatNodes.push({
      id: node.id,
      item: node.item,
      x,
      y,
      levelIndex: node.levelIndex,
      childrenIds: node.children.map(c => c.id)
    });

    node.children.forEach(child => {
      const childX = paddingX + child.levelIndex * colWidth;
      const childY = paddingY + child.y * rowHeight;

      // Draw standard beautiful bezier curve
      const cpX1 = x + colWidth * 0.45;
      const cpY1 = y;
      const cpX2 = childX - colWidth * 0.45;
      const cpY2 = childY;
      const pathData = `M ${x} ${y} C ${cpX1} ${cpY1}, ${cpX2} ${cpY2}, ${childX} ${childY}`;

      flatLinks.push({
        id: `${node.id}->${child.id}`,
        sourceId: node.id,
        targetId: child.id,
        pathData
      });

      fillCoordinates(child);
    });
  };

  tempRoots.forEach(fillCoordinates);

  return {
    nodes: flatNodes,
    links: flatLinks,
    width,
    height: calculatedHeight
  };
}
