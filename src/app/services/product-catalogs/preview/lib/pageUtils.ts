/**
 * Utility functions for PDF preview page hierarchy and navigation
 */

export function getPagesInPath(path: string, assignments: Record<number, string>): number[] {
  return Object.entries(assignments)
    .filter(([, p]) => p === path)
    .map(([pageNum]) => parseInt(pageNum, 10))
    .sort((a, b) => a - b);
}

export function getChildPaths(parentPath: string, metadata: Record<string, { title: string }>): string[] {
  const prefix = parentPath === 'root' ? '' : `${parentPath}/`;
  const children = new Set<string>();
  
  Object.keys(metadata).forEach((path) => {
    if (path !== 'root') {
      if (prefix === '' && !path.includes('/')) {
        children.add(path);
      } else if (prefix && path.startsWith(prefix) && !path.slice(prefix.length).includes('/')) {
        children.add(path);
      }
    }
  });

  return Array.from(children).sort();
}

export function getMinPageInPath(path: string, assignments: Record<number, string>, metadata: Record<string, { title: string }>): number {
  const directPages = getPagesInPath(path, assignments);
  if (directPages.length > 0) return Math.min(...directPages);
  
  const childPaths = getChildPaths(path, metadata);
  const childMins = childPaths
    .map(childPath => getMinPageInPath(childPath, assignments, metadata))
    .filter(n => !isNaN(n));
  
  return childMins.length > 0 ? Math.min(...childMins) : Infinity;
}

export function encodePathSegment(segment: string): string {
  return encodeURIComponent(segment);
}

export function decodePathSegment(segment: string): string {
  return decodeURIComponent(segment);
}

export function getAncestorPaths(path: string): string[] {
  if (path === 'root') return ['root'];

  const segments = path.split('/');
  const ancestors = ['root'];

  for (let i = 0; i < segments.length; i++) {
    ancestors.push(segments.slice(0, i + 1).join('/'));
  }

  return ancestors;
}

export function getPathForPage(pageNum: number, assignments: Record<number, string>): string {
  return assignments[pageNum] || 'root';
}

export function isPathAGroup(path: string, metadata: Record<string, { title: string }>): boolean {
  const childPaths = getChildPaths(path, metadata);
  return childPaths.length > 0;
}

export function getAllPagesInPathRecursive(path: string, assignments: Record<number, string>, metadata: Record<string, { title: string }>): number[] {
  const directPages = getPagesInPath(path, assignments);
  const childPaths = getChildPaths(path, metadata);

  const items: Array<{ type: 'page' | 'group'; pageNum?: number; path?: string; minPage?: number }> = [];

  directPages.forEach(pageNum => {
    items.push({ type: 'page', pageNum, minPage: pageNum });
  });

  childPaths.forEach(childPath => {
    items.push({ type: 'group', path: childPath, minPage: getMinPageInPath(childPath, assignments, metadata) });
  });

  items.sort((a, b) => (a.minPage || Infinity) - (b.minPage || Infinity));

  const result: number[] = [];

  function flattenItems(itemList: typeof items) {
    itemList.forEach(item => {
      if (item.type === 'page') {
        result.push(item.pageNum!);
      } else if (item.path) {
        const childPages = getAllPagesInPathRecursive(item.path, assignments, metadata);
        result.push(...childPages);
      }
    });
  }

  flattenItems(items);
  return result;
}

export function getPathForPageNum(pageNum: number, assignments: Record<number, string>): string {
  return assignments[pageNum] || 'root';
}

export function buildPreviewUrl(documentId: string, path: string, pageNum: number, titles: string[]): string {
  const pageTitle = titles[pageNum - 1] || `Page ${pageNum}`;
  const encodedTitle = encodePathSegment(pageTitle);

  if (path === 'root') {
    return `/services/product-catalogs/preview/${documentId}/${encodedTitle}`;
  }

  const encodedPath = path.split('/').map(encodePathSegment).join('/');
  return `/services/product-catalogs/preview/${documentId}/${encodedPath}/${encodedTitle}`;
}
