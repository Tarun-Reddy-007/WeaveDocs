'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import dynamic from 'next/dynamic';
import { useHierarchy } from '@/lib/HierarchyContext';

const PDFViewer = dynamic(() => import('@/components/PDFViewer').then(mod => mod.PDFViewer), { ssr: false });

interface PageRange {
  start: number;
  end: number;
  title: string;
}

function getPagesInPath(path: string, assignments: Record<number, string>): number[] {
  return Object.entries(assignments)
    .filter(([_, p]) => p === path)
    .map(([pageNum]) => parseInt(pageNum, 10))
    .sort((a, b) => a - b);
}

function getChildPaths(parentPath: string, metadata: Record<string, { title: string }>): string[] {
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

function getMinPageInPath(path: string, assignments: Record<number, string>, metadata: Record<string, { title: string }>): number {
  const directPages = getPagesInPath(path, assignments);
  if (directPages.length > 0) return Math.min(...directPages);
  
  const childPaths = getChildPaths(path, metadata);
  const childMins = childPaths
    .map(childPath => getMinPageInPath(childPath, assignments, metadata))
    .filter(n => !isNaN(n));
  
  return childMins.length > 0 ? Math.min(...childMins) : Infinity;
}

export default function PreviewPage() {
  const params = useParams();
  const { pdfUrl, pageAssignments, groupMetadata, pageTitles } = useHierarchy();
  
  const documentId = params.documentId as string;
  const pathSegments = (params.path as string[]) || [];
  
  const [currentPageNum, setCurrentPageNum] = useState(1);
  const [expandedPaths, setExpandedPaths] = useState<Set<string>>(new Set(['root']));
  const [selectedPath, setSelectedPath] = useState<string | null>(null);
  const [pageRange, setPageRange] = useState<PageRange | null>(null);

  // Determine current page range
  useEffect(() => {
    if (Object.keys(pageAssignments).length === 0) return;

    const reconstructedPath = pathSegments.length > 0 
      ? pathSegments.join('/') 
      : 'root';

    const pages = getPagesInPath(reconstructedPath, pageAssignments);
    if (pages.length > 0) {
      setSelectedPath(reconstructedPath);
      setPageRange({
        start: pages[0],
        end: pages[pages.length - 1],
        title: reconstructedPath === 'root' ? 'Cover' : (groupMetadata[reconstructedPath]?.title || 'Page'),
      });
      setCurrentPageNum(pages[0]);
    } else {
      // Default to cover page
      setCurrentPageNum(1);
      setSelectedPath('root');
      setPageRange({ start: 1, end: 1, title: 'Cover' });
    }
  }, [pageAssignments, pathSegments, groupMetadata]);

  const handlePathClick = (path: string) => {
    const pages = getPagesInPath(path, pageAssignments);
    if (pages.length > 0) {
      setSelectedPath(path);
      setPageRange({
        start: pages[0],
        end: pages[pages.length - 1],
        title: path === 'root' ? 'Cover' : (groupMetadata[path]?.title || 'Page'),
      });
      setCurrentPageNum(pages[0]);
    }
  };

  const renderHierarchy = (parentPath: string = 'root', depth: number = 0) => {
    const childPaths = getChildPaths(parentPath, groupMetadata);
    const pages = getPagesInPath(parentPath, pageAssignments);
    const isExpanded = expandedPaths.has(parentPath);

    const items: Array<{ type: 'page' | 'group'; pageNum?: number; path?: string; minPage?: number }> = [];

    // Add direct pages in this path
    pages.forEach(pageNum => {
      items.push({ type: 'page', pageNum, minPage: pageNum });
    });

    // Add child groups
    childPaths.forEach(childPath => {
      items.push({ type: 'group', path: childPath, minPage: getMinPageInPath(childPath, pageAssignments, groupMetadata) });
    });

    // Sort items by minimum page number
    items.sort((a, b) => (a.minPage || Infinity) - (b.minPage || Infinity));

    return (
      <div>
        {items.map((item) => {
          if (item.type === 'page') {
            const pageNum = item.pageNum!;
            return (
              <div key={`page-${pageNum}`} style={{ paddingLeft: `${depth * 16}px` }} className="group">
                <button
                  onClick={() => handlePathClick(parentPath)}
                  className="w-full text-left text-sm py-1 px-2 rounded hover:bg-gray-100 text-gray-900 flex items-center gap-2"
                >
                  <span className="bg-black text-white text-xs font-medium w-5 h-5 rounded-full flex items-center justify-center">{pageNum}</span>
                  <span>{pageTitles[pageNum - 1] || `Title ${pageNum}`}</span>
                </button>
              </div>
            );
          }

          // Type: group
          const path = item.path!;
          const title = groupMetadata[path]?.title || 'Group';
          const groupPages = getPagesInPath(path, pageAssignments);
          const subGroups = getChildPaths(path, groupMetadata);
          const hasChildren = subGroups.length > 0 || groupPages.length > 0;
          const isGroupExpanded = expandedPaths.has(path);

          return (
            <div key={path}>
              <div style={{ paddingLeft: `${depth * 16}px` }} className="group">
                <div className="flex items-center gap-1">
                  {hasChildren && (
                    <button
                      type="button"
                      onClick={() => {
                        setExpandedPaths(prev => {
                          const next = new Set(prev);
                          if (next.has(path)) {
                            next.delete(path);
                          } else {
                            next.add(path);
                          }
                          return next;
                        });
                      }}
                      className="flex-shrink-0 w-5 flex items-center justify-center text-gray-400 hover:text-gray-600"
                    >
                      <span className={`text-xs transition-transform ${isGroupExpanded ? 'rotate-90' : ''}`}>
                        ▶
                      </span>
                    </button>
                  )}
                  {!hasChildren && <span className="w-5"></span>}

                  <button
                    onClick={() => handlePathClick(path)}
                    className="flex-1 text-left text-sm font-medium py-1 px-2 rounded hover:bg-gray-100 text-gray-900"
                  >
                    📁 {title}
                  </button>
                </div>
              </div>

              {isGroupExpanded && hasChildren && (
                <div>
                  {renderHierarchy(path, depth + 1)}
                </div>
              )}
            </div>
          );
        })}
      </div>
    );
  };

  if (Object.keys(pageAssignments).length === 0) {
    return (
      <div className="w-full h-screen flex items-center justify-center">
        <p className="text-gray-500">No PDF loaded. Go back to create a catalog.</p>
      </div>
    );
  }

  const totalPagesInRange = pageRange ? (pageRange.end - pageRange.start + 1) : 1;
  const currentIndex = pageRange ? (currentPageNum - pageRange.start) : 0;

  return (
    <div className="flex h-screen bg-white">
      {/* Left Pane - Hierarchy (25%) */}
      <div className="w-1/4 bg-white border-r border-gray-200 overflow-auto p-4">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Catalog</h2>
        {renderHierarchy()}
      </div>

      {/* Center Pane - PDF Viewer (50%) */}
      <div className="w-1/2 bg-gray-50 flex flex-col overflow-hidden">
        <div className="flex-1 overflow-hidden flex flex-col">
          {pageRange && (
            <div className="bg-white border-b border-gray-200 px-4 py-2 text-sm text-gray-600">
              {pageRange.title} (Page {currentIndex + 1} of {totalPagesInRange})
            </div>
          )}
          
          <div className="flex-1 overflow-hidden">
            <PDFViewer
              pdfUrl={pdfUrl}
              currentPage={currentPageNum}
              onTotalPagesChange={() => {}}
            />
          </div>

          {pageRange && totalPagesInRange > 1 && (
            <div className="bg-white border-t border-gray-200 px-4 py-3 flex items-center justify-center gap-4">
              <button
                onClick={() => setCurrentPageNum(Math.max(pageRange.start, currentPageNum - 1))}
                disabled={currentPageNum <= pageRange.start}
                className="p-2 rounded disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-200"
              >
                ◀
              </button>
              <span className="text-sm font-medium">
                {currentIndex + 1} / {totalPagesInRange}
              </span>
              <button
                onClick={() => setCurrentPageNum(Math.min(pageRange.end, currentPageNum + 1))}
                disabled={currentPageNum >= pageRange.end}
                className="p-2 rounded disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-200"
              >
                ▶
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Right Pane - Empty (25%) */}
      <div className="w-1/4 bg-white border-l border-gray-200"></div>
    </div>
  );
}
