'use client';

import { useState, useEffect, useRef } from 'react';
import { useParams, usePathname, useRouter } from 'next/navigation';
import dynamic from 'next/dynamic';
import { ChevronDown, ChevronRight } from 'lucide-react';
import { useHierarchy } from '@/lib/HierarchyContext';

const PDFViewer = dynamic(() => import('@/components/PDFViewer').then(mod => mod.PDFViewer), { ssr: false });

const SHARE_ICON = (
  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684 13.342C9.589 12.41 10.846 12 12 12c1.153 0 2.411.41 3.316 1.342m0 0l-3.57-3.571a3 3 0 00-4.242 0l3.496 3.229zM9 3a9 9 0 1 0 18 0 9 9 0 0 0-18 0z" />
  </svg>
);

const DOWNLOAD_ICON = (
  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
  </svg>
);

interface PageRange {
  start: number;
  end: number;
  title: string;
}

function getPagesInPath(path: string, assignments: Record<number, string>): number[] {
  return Object.entries(assignments)
    .filter(([, p]) => p === path)
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

// Helper function to encode titles/paths for URLs with default URI encoding
function encodePathSegment(segment: string): string {
  return encodeURIComponent(segment);
}

function getAncestorPaths(path: string): string[] {
  if (path === 'root') return ['root'];

  const segments = path.split('/');
  const ancestors = ['root'];

  for (let i = 0; i < segments.length; i++) {
    ancestors.push(segments.slice(0, i + 1).join('/'));
  }

  return ancestors;
}

function getPathForPage(pageNum: number, assignments: Record<number, string>): string {
  return assignments[pageNum] || 'root';
}

function isPathAGroup(path: string, metadata: Record<string, { title: string }>): boolean {
  const childPaths = getChildPaths(path, metadata);
  return childPaths.length > 0;
}

function getAllPagesInPathRecursive(path: string, assignments: Record<number, string>, metadata: Record<string, { title: string }>): number[] {
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

function getPathForPageNum(pageNum: number, assignments: Record<number, string>): string {
  return assignments[pageNum] || 'root';
}

function buildPreviewUrl(documentId: string, path: string, pageNum: number, titles: string[]): string {
  const pageTitle = titles[pageNum - 1] || `Page ${pageNum}`;
  const encodedTitle = encodePathSegment(pageTitle);

  if (path === 'root') {
    return `/services/product-catalogs/preview/${documentId}/${encodedTitle}`;
  }

  const encodedPath = path.split('/').map(encodePathSegment).join('/');
  return `/services/product-catalogs/preview/${documentId}/${encodedPath}/${encodedTitle}`;
}

// Helper function to decode URL segments back to titles
function decodePathSegment(segment: string): string {
  return decodeURIComponent(segment);
}

interface PageStackItemProps {
  pageNum: number;
  pdfUrl: string | null;
  pageTitles: string[];
  pageHeightsRef: React.MutableRefObject<Map<number, { top: number; height: number }>>;
  pdfContainerRef: React.RefObject<HTMLDivElement | null>;
  selectedPath: string;
  params: any;
  navigateToPreviewUrl: (url: string) => void;
  setCurrentPageNum: (pageNum: number) => void;
  onInternalLinkClick?: (pageNum: number) => void;
}

function PageStackItem({
  pageNum,
  pdfUrl,
  pageTitles,
  pageHeightsRef,
  pdfContainerRef,
  selectedPath,
  params,
  navigateToPreviewUrl,
  setCurrentPageNum,
  onInternalLinkClick,
}: PageStackItemProps) {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const observer = new ResizeObserver(() => {
      if (containerRef.current && pdfContainerRef.current) {
        const rect = containerRef.current.getBoundingClientRect();
        const parentRect = pdfContainerRef.current.getBoundingClientRect();
        const relativeTop = rect.top - parentRect.top + pdfContainerRef.current.scrollTop;
        
        pageHeightsRef.current.set(pageNum, {
          top: relativeTop,
          height: rect.height,
        });
      }
    });

    if (containerRef.current) {
      observer.observe(containerRef.current);
    }

    return () => {
      observer.disconnect();
    };
  }, [pageNum, pageHeightsRef, pdfContainerRef]);

  return (
    <div 
      key={`page-${pageNum}`}
      ref={containerRef}
      className="mb-8 w-full"
    >
      <PDFViewer
        pdfUrl={pdfUrl}
        currentPage={pageNum}
        onTotalPagesChange={() => {}}
        onInternalLinkClick={onInternalLinkClick}
        fitToContainer={false}
      />
    </div>
  );
}

export default function PreviewPage() {
  const params = useParams();
  const pathname = usePathname();
  const router = useRouter();
  const { pdfUrl, pageAssignments, groupMetadata, pageTitles, pdfFileName, docName, themeColors } = useHierarchy();
  
  const [currentPageNum, setCurrentPageNum] = useState(1);
  const [expandedPaths, setExpandedPaths] = useState<Set<string>>(new Set(['root']));
  const [pageRange, setPageRange] = useState<PageRange | null>(null);
  const [selectedPath, setSelectedPath] = useState<string>('root');
  const [pagesInSelectedPath, setPagesInSelectedPath] = useState<number[]>([]);
  const [viewingPathDuringScroll, setViewingPathDuringScroll] = useState<string>('root');
  const [hasInitialized, setHasInitialized] = useState(false);
  const pdfContainerRef = useRef<HTMLDivElement>(null);
  const pageHeightsRef = useRef<Map<number, { top: number; height: number }>>(new Map());
  const pageToPathMapRef = useRef<Map<number, string>>(new Map());
  const lastDocumentIdRef = useRef<string>('');

  const updateExpandedPaths = (path: string) => {
    setExpandedPaths(prev => {
      const next = new Set(prev);
      getAncestorPaths(path).forEach(ancestor => next.add(ancestor));
      return next;
    });
  };

  const navigateToPreviewUrl = (url: string, mode: 'push' | 'replace' = 'push') => {
    if (pathname === url) {
      return;
    }

    if (mode === 'replace') {
      router.replace(url);
      return;
    }

    router.push(url);
  };

  // Helper to determine what pages to show for a given path
  const getPagesToShowForPath = (path: string): number[] => {
    // Special case: 'root' only shows pages directly assigned to root
    if (path === 'root') {
      return getPagesInPath('root', pageAssignments);
    }
    
    // If path is a group (has child groups), show all pages recursively
    const isGroup = isPathAGroup(path, groupMetadata);
    if (isGroup) {
      return getAllPagesInPathRecursive(path, pageAssignments, groupMetadata);
    }
    
    // Otherwise, show only pages directly assigned to this path
    return getPagesInPath(path, pageAssignments);
  };

  // Initialize on first load ONLY - not on every URL change
  useEffect(() => {
    if (Object.keys(pageAssignments).length === 0 || hasInitialized) return;

    const pathSegments = (params.path as string[]) || [];
    const documentId = (params.documentId as string) || '';
    const defaultPageNum = 1;
    const defaultPath = getPathForPage(defaultPageNum, pageAssignments);

    let pathToShow = defaultPath;
    let pageToShow = defaultPageNum;
    let pagesToShow: number[] = [];
    
    if (pathSegments.length === 0) {
      // No path in URL - show just the first page initially
      pathToShow = defaultPath;
      pageToShow = defaultPageNum;
      pagesToShow = [defaultPageNum];
    } else {
      // Parse URL path - last segment could be a page title or a group name
      const lastSegment = pathSegments[pathSegments.length - 1];
      const decodedLastSegment = decodePathSegment(lastSegment);
      let foundPageNum: number | null = null;
      
      // Check if last segment is a page title
      for (let i = 0; i < pageTitles.length; i++) {
        const title = pageTitles[i] || `Page ${i + 1}`;
        if (title === decodedLastSegment) {
          foundPageNum = i + 1;
          break;
        }
      }

      // Build the group path
      let groupPath = 'root';
      if (foundPageNum !== null) {
        // Last segment is a page title - group path is everything before it
        if (pathSegments.length > 1) {
          const groupSegments = pathSegments.slice(0, -1);
          groupPath = groupSegments.map(decodePathSegment).join('/');
        }
      } else if (decodedLastSegment in groupMetadata) {
        // Last segment is a group name - include it in the group path
        groupPath = pathSegments.map(decodePathSegment).join('/');
        pageToShow = getPagesInPath(groupPath, pageAssignments)[0] || defaultPageNum;
      } else {
        // Last segment is neither page nor group - treat as group path if valid, otherwise error
        groupPath = pathSegments.map(decodePathSegment).join('/');
        if (!(groupPath in groupMetadata) && groupPath !== 'root') {
          // Invalid path - fallback
          groupPath = 'root';
        }
      }

      // Validate group path exists (if not root)
      if (groupPath !== 'root' && !(groupPath in groupMetadata)) {
        pathToShow = defaultPath;
        pageToShow = defaultPageNum;
        pagesToShow = [defaultPageNum];
      } else {
        pathToShow = groupPath;
        pageToShow = foundPageNum || defaultPageNum;
        
        // CRITICAL: If URL has a page title at the end, show ONLY that page
        // Otherwise, show the group/path pages normally
        if (foundPageNum !== null) {
          // User directly clicked on a specific page - show only that page
          pagesToShow = [foundPageNum];
        } else {
          // User clicked on a group - show all pages in that group
          pagesToShow = getPagesToShowForPath(groupPath);
        }
      }
    }

    // Build page-to-path mapping
    const pageToPathMap = new Map<number, string>();
    const buildPathMap = (currentPath: string) => {
      const directPages = getPagesInPath(currentPath, pageAssignments);
      directPages.forEach(p => {
        pageToPathMap.set(p, currentPath);
      });
      
      const childPaths = getChildPaths(currentPath, groupMetadata);
      childPaths.forEach(childPath => {
        buildPathMap(childPath);
      });
    };
    
    buildPathMap(pathToShow);
    pageToPathMapRef.current = pageToPathMap;

    const validPageToShow = pagesToShow.includes(pageToShow) ? pageToShow : pagesToShow[0] || pageToShow;

    setPagesInSelectedPath(pagesToShow);
    setCurrentPageNum(validPageToShow);
    setSelectedPath(pathToShow);
    setViewingPathDuringScroll(pathToShow);
    setPageRange({
      start: pagesToShow[0] || validPageToShow,
      end: pagesToShow[pagesToShow.length - 1] || validPageToShow,
      title: pathToShow === 'root' ? 'Cover' : (groupMetadata[pathToShow]?.title || 'Page'),
    });
    
    updateExpandedPaths(pathToShow);
    setHasInitialized(true);
    lastDocumentIdRef.current = documentId;
  }, [pageAssignments, groupMetadata, pageTitles, params.documentId]);

  // Handle scroll - only update breadcrumb highlighting, don't change what's displayed or URL
  useEffect(() => {
    if (!pdfContainerRef.current || pagesInSelectedPath.length === 0 || !hasInitialized) return;

    const container = pdfContainerRef.current;

    const handleScroll = () => {
      if (!pdfContainerRef.current) return;

      const scrollTop = pdfContainerRef.current.scrollTop;
      const containerHeight = pdfContainerRef.current.clientHeight;
      const centerPoint = scrollTop + (containerHeight / 2);

      let closestPage = pagesInSelectedPath[0];
      let closestDistance = Infinity;

      pagesInSelectedPath.forEach(pageNum => {
        const pageInfo = pageHeightsRef.current.get(pageNum);
        if (pageInfo) {
          const pageCenter = pageInfo.top + (pageInfo.height / 2);
          const distance = Math.abs(pageCenter - centerPoint);

          if (distance < closestDistance) {
            closestDistance = distance;
            closestPage = pageNum;
          }
        }
      });

      if (closestPage !== currentPageNum) {
        // Update current page number for title display
        setCurrentPageNum(closestPage);
        
        // Find the actual path of this page for breadcrumb highlighting only
        const pagePath = pageToPathMapRef.current.get(closestPage) || selectedPath;
        setViewingPathDuringScroll(pagePath);
        
        // Don't update URL during scroll - this keeps the display stable
        // URL will only change when user explicitly clicks something
      }
    };

    container.addEventListener('scroll', handleScroll, { passive: true });

    return () => {
      container.removeEventListener('scroll', handleScroll);
    };
  }, [pagesInSelectedPath, currentPageNum, hasInitialized]);

  const handlePathClick = (path: string) => {
    // Build page-to-path mapping
    const pageToPathMap = new Map<number, string>();
    const buildPathMap = (currentPath: string) => {
      const directPages = getPagesInPath(currentPath, pageAssignments);
      directPages.forEach(p => {
        pageToPathMap.set(p, currentPath);
      });
      
      const childPaths = getChildPaths(currentPath, groupMetadata);
      childPaths.forEach(childPath => {
        buildPathMap(childPath);
      });
    };
    
    buildPathMap(path);
    pageToPathMapRef.current = pageToPathMap;

    // Get pages to show using the helper
    const pagesToShow = getPagesToShowForPath(path);
    
    if (pagesToShow.length > 0) {
      const firstPage = pagesToShow[0];
      
      setPagesInSelectedPath(pagesToShow);
      setPageRange({
        start: pagesToShow[0],
        end: pagesToShow[pagesToShow.length - 1],
        title: path === 'root' ? 'Cover' : (groupMetadata[path]?.title || 'Page'),
      });
      setCurrentPageNum(firstPage);
      setSelectedPath(path);
      setViewingPathDuringScroll(path);
      updateExpandedPaths(path);
      
      // Clear scroll position when changing selection
      if (pdfContainerRef.current) {
        pdfContainerRef.current.scrollTop = 0;
      }
      
      // For group clicks, URL ends with group path (no page title)
      // So URL will be /preview/doc/{path}
      const documentId = (params.documentId as string) || '';
      let groupUrl = `/services/product-catalogs/preview/${documentId}`;
      if (path !== 'root') {
        const encodedPath = path.split('/').map(encodePathSegment).join('/');
        groupUrl += `/${encodedPath}`;
      } else {
        // For root, show first page in URL
        const pageTitle = pageTitles[firstPage - 1] || `Page ${firstPage}`;
        const encodedTitle = encodePathSegment(pageTitle);
        groupUrl += `/${encodedTitle}`;
      }
      navigateToPreviewUrl(groupUrl);
    }
  };

  const handlePageClick = (path: string, pageNum: number) => {
    // Build page-to-path mapping
    const pageToPathMap = new Map<number, string>();
    const buildPathMap = (currentPath: string) => {
      const directPages = getPagesInPath(currentPath, pageAssignments);
      directPages.forEach(p => {
        pageToPathMap.set(p, currentPath);
      });
      
      const childPaths = getChildPaths(currentPath, groupMetadata);
      childPaths.forEach(childPath => {
        buildPathMap(childPath);
      });
    };
    
    buildPathMap(path);
    pageToPathMapRef.current = pageToPathMap;

    // Clicking on a page shows ONLY that page
    const pagesToShow = [pageNum];
    
    setSelectedPath(path);
    setCurrentPageNum(pageNum);
    setPagesInSelectedPath(pagesToShow);
    setViewingPathDuringScroll(path);
    setPageRange({
      start: pageNum,
      end: pageNum,
      title: pageTitles[pageNum - 1] || `Page ${pageNum}`,
    });
    updateExpandedPaths(path);
    
    // Clear scroll position when changing selection
    if (pdfContainerRef.current) {
      pdfContainerRef.current.scrollTop = 0;
    }
    
    const documentId = (params.documentId as string) || '';
    navigateToPreviewUrl(buildPreviewUrl(documentId, path, pageNum, pageTitles));
  };

  const renderHierarchy = (parentPath: string = 'root', depth: number = 0) => {
    const childPaths = getChildPaths(parentPath, groupMetadata);
    const pages = getPagesInPath(parentPath, pageAssignments);

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
            const isSelected = selectedPath === parentPath && currentPageNum === pageNum;
            const isViewing = viewingPathDuringScroll === parentPath && currentPageNum === pageNum;
            // Show highlight if either selected or part of viewing breadcrumb
            const shouldHighlight = isSelected || isViewing;
            
            return (
              <div key={`page-${pageNum}`} style={{ paddingLeft: `${depth * 12}px` }} className="mr-6">
                <button
                  onClick={() => handlePageClick(parentPath, pageNum)}
                  className={`w-full text-left text-sm py-2 px-3 transition-colors border-r-4 truncate ${shouldHighlight ? 'font-bold' : 'hover:cursor-pointer'}`}
                  style={{
                    color: primaryColor,
                    borderRightColor: shouldHighlight ? componentColor : 'transparent',
                  }}
                >
                  {pageTitles[pageNum - 1] || `Title ${pageNum}`}
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
          const isSelected = selectedPath === path;
          // Check if this path is in the viewing breadcrumb
          const isInViewingBreadcrumb = getAncestorPaths(viewingPathDuringScroll).includes(path);
          const shouldHighlight = isSelected || isInViewingBreadcrumb;

          return (
            <div key={path}>
              <div style={{ paddingLeft: `${depth * 12}px` }} className="mr-6">
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
                      className="flex-shrink-0 w-5 flex items-center justify-center font-semibold"
                      style={{ color: primaryColor }}
                    >
                      {isGroupExpanded ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
                    </button>
                  )}
                  {!hasChildren && <span className="w-5"></span>}

                  <button
                    onClick={() => handlePathClick(path)}
                    className={`flex-1 text-left text-sm py-2 px-2 transition-colors border-r-4 truncate ${shouldHighlight ? 'font-bold' : 'hover:cursor-pointer'}`}
                    style={{
                      color: primaryColor,
                      borderRightColor: shouldHighlight ? componentColor : 'transparent',
                    }}
                  >
                    {title}
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

  const primaryColor = themeColors?.primaryColor || '#0f172a';
  const componentColor = themeColors?.componentColor || '#22c55e';
  const backgroundColor = themeColors?.backgroundColor || '#f3f4f6';
  const fontStyle = themeColors?.fontStyle || 'Arial';

  if (Object.keys(pageAssignments).length === 0) {
    return (
      <div className="w-full h-screen flex items-center justify-center" style={{ backgroundColor }}>
        <p style={{ color: primaryColor }}>No PDF loaded. Go back to create a catalog.</p>
      </div>
    );
  }

  const totalPagesInRange = pageRange ? (pageRange.end - pageRange.start + 1) : 1;
  const currentIndex = pageRange ? (currentPageNum - pageRange.start) : 0;
  const documentId = (params.documentId as string) || '';
  const isGroupSelected = selectedPath !== 'root' && pageRange && totalPagesInRange > 1;

  const handleCopyLink = () => {
    const pageLink = `${window.location.origin}/services/product-catalogs/preview/${params.documentId}`;
    
    // Add path to link if we have a selected path other than root
    let fullLink = pageLink;
    if (selectedPath !== 'root') {
      const encodedPath = selectedPath.split('/').map(encodePathSegment).join('/');
      fullLink += `/${encodedPath}`;
    }
    
    // Add page title to link if viewing a specific page
    const pageTitle = pageTitles[currentPageNum - 1] || `Page ${currentPageNum}`;
    const encodedTitle = encodePathSegment(pageTitle);
    fullLink += `/${encodedTitle}`;
    
    navigator.clipboard.writeText(fullLink).then(() => {
      alert('Link copied to clipboard!');
    });
  };

  const handleDownloadCatalog = () => {
    if (pdfUrl) {
      const link = document.createElement('a');
      link.href = pdfUrl;
      link.download = pdfFileName || 'catalog.pdf';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
  };

  return (
    <div className="flex flex-col h-screen" style={{ color: primaryColor, backgroundColor, fontFamily: fontStyle, ['--component-color' as any]: componentColor }}>
      {/* Header */}
      <div className="px-16 pb-5 pt-6">
        <div className="max-w-full mx-auto">
          <div className="flex items-start justify-between gap-4">
            <div className="flex-1">
              <h1 className="text-4xl font-bold" style={{ color: primaryColor, fontFamily: fontStyle }}>
                {docName || (pdfFileName ? pdfFileName.replace(/\.pdf$/i, '') : 'Catalog')}
              </h1>
              <div className="flex items-center justify-between mt-1 gap-4">
                    <p className="text-l " style={{ color: primaryColor, fontFamily: fontStyle }}>{documentId}</p>
                    <div className="flex items-center gap-4">
                      <button
                        onClick={handleCopyLink}
                        className="flex cursor-pointer items-center gap-2 rounded-lg px-3 py-2 text-blue-600 transition-colors hover:underline"
                        title="Share catalog link"
                      >
                        {SHARE_ICON}
                        <span className="text-sm font-medium">Share</span>
                      </button>
                      <button
                        onClick={handleDownloadCatalog}
                        className="flex cursor-pointer items-center gap-2 rounded-lg px-3 py-2 text-blue-600 transition-colors hover:underline"
                        title="Download catalog"
                      >
                        {DOWNLOAD_ICON}
                        <span className="text-sm font-medium">Download PDF</span>
                      </button>
                    </div>
                  </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex flex-1 overflow-hidden">
        {/* Left Sidebar - Hierarchy */}
        <div 
          className="w-96 overflow-y-auto flex flex-col pl-16"
          style={{
            backgroundColor,
            fontFamily: fontStyle,
            scrollbarWidth: 'thin',
            scrollbarColor: `${componentColor} transparent`,
          }}
        >
          <style>{`
            div::-webkit-scrollbar {
              width: 4px;
            }
            div::-webkit-scrollbar-track {
              background: transparent;
            }
            div::-webkit-scrollbar-thumb {
              background-color: ${componentColor};
              border-radius: 2px;
            }
          `}</style>
          <div className="flex-1 overflow-auto">
            <nav className="py-2">
              {renderHierarchy()}
            </nav>
          </div>
        </div>

        {/* Right Content - PDF and Title */}
        <div className="flex-1 flex flex-col overflow-hidden py-0 px-8" style={{ backgroundColor, fontFamily: fontStyle }}>
          {/* Title Section */}
          <div>
            <h2 className="text-3xl font-bold" style={{ color: primaryColor, fontFamily: fontStyle }}>
              {pageTitles[currentPageNum - 1] || `Page ${currentPageNum}`}
            </h2>
          </div>

          {/* PDF Viewer - Stacked or Single Page */}
          <div className="flex-1 overflow-hidden flex flex-col">
            {pagesInSelectedPath.length > 1 ? (
              // Multiple pages: show stacked with scroll
              <div 
                ref={pdfContainerRef}
                className="flex-1 overflow-y-auto flex flex-col"
                style={{
                  scrollbarWidth: 'thin',
                  scrollbarColor: `${componentColor} transparent`,
                }}
              >
                <style>{`
                  div::-webkit-scrollbar {
                    width: 8px;
                  }
                  div::-webkit-scrollbar-track {
                    background: transparent;
                  }
                  div::-webkit-scrollbar-thumb {
                    background-color: ${componentColor};
                    border-radius: 4px;
                  }
                `}</style>
                <div className="flex flex-col">
                  {pagesInSelectedPath.map((pageNum) => (
                    <PageStackItem
                      key={`page-${pageNum}`}
                      pageNum={pageNum}
                      pdfUrl={pdfUrl}
                      pageTitles={pageTitles}
                      pageHeightsRef={pageHeightsRef}
                      pdfContainerRef={pdfContainerRef}
                      selectedPath={selectedPath}
                      params={params}
                      navigateToPreviewUrl={navigateToPreviewUrl}
                      setCurrentPageNum={setCurrentPageNum}
                      onInternalLinkClick={(newPageNum) => {
                        const newPageIndex = pagesInSelectedPath.indexOf(newPageNum);
                        if (newPageIndex !== -1) {
                          setCurrentPageNum(newPageNum);
                          const pageActualPath = pageToPathMapRef.current.get(newPageNum) || selectedPath;
                          const documentId = (params.documentId as string) || '';
                          navigateToPreviewUrl(buildPreviewUrl(documentId, pageActualPath, newPageNum, pageTitles));
                        }
                      }}
                    />
                  ))}
                </div>
              </div>
            ) : pagesInSelectedPath.length === 1 ? (
              // Single page: show without scroll
              <div className="flex-1 overflow-hidden w-full">
                <PDFViewer
                  pdfUrl={pdfUrl}
                  currentPage={pagesInSelectedPath[0]}
                  onTotalPagesChange={() => {}}
                  onInternalLinkClick={(newPageNum) => {
                    setCurrentPageNum(newPageNum);
                    const documentId = (params.documentId as string) || '';
                    navigateToPreviewUrl(buildPreviewUrl(documentId, selectedPath, newPageNum, pageTitles));
                  }}
                  fitToContainer={false}
                />
              </div>
            ) : null}
          </div>
        </div>
      </div>
    </div>
  );
}
