'use client';

import { useState, useEffect } from 'react';
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

export default function PreviewPage() {
  const params = useParams();
  const pathname = usePathname();
  const router = useRouter();
  const { pdfUrl, pageAssignments, groupMetadata, pageTitles, pdfFileName, themeColors } = useHierarchy();
  
  const [currentPageNum, setCurrentPageNum] = useState(1);
  const [expandedPaths, setExpandedPaths] = useState<Set<string>>(new Set(['root']));
  const [pageRange, setPageRange] = useState<PageRange | null>(null);
  const [selectedPath, setSelectedPath] = useState<string>('root');

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

  // Determine current page range
  useEffect(() => {
    if (Object.keys(pageAssignments).length === 0) return;

    const pathSegments = (params.path as string[]) || [];
    const documentId = (params.documentId as string) || '';
    const defaultPageNum = 1;
    const defaultPath = getPathForPage(defaultPageNum, pageAssignments);

    const applySelection = (path: string, pageNum: number) => {
      const pages = getPagesInPath(path, pageAssignments);
      const resolvedPageNum = pages.includes(pageNum) ? pageNum : pages[0] || pageNum;

      setCurrentPageNum(resolvedPageNum);
      setPageRange({
        start: pages[0] || resolvedPageNum,
        end: pages[pages.length - 1] || resolvedPageNum,
        title: path === 'root' ? 'Cover' : (groupMetadata[path]?.title || 'Page'),
      });
      setSelectedPath(path);
      updateExpandedPaths(path);
    };
    
    if (pathSegments.length === 0) {
      applySelection(defaultPath, defaultPageNum);
      navigateToPreviewUrl(buildPreviewUrl(documentId, defaultPath, defaultPageNum, pageTitles), 'replace');
      return;
    }

    // Last segment could be page title
    const lastSegment = pathSegments[pathSegments.length - 1];
    
    // Check if the last segment matches any page title
    let pageNum: number | null = null;
    
    for (let i = 0; i < pageTitles.length; i++) {
      const title = pageTitles[i] || `Page ${i + 1}`;
      if (title === decodePathSegment(lastSegment)) {
        pageNum = i + 1;
        break;
      }
    }

    // Build the group path from all segments except the last one (if it's a page title)
    let groupPath = 'root';
    let hasPageAtEnd = pageNum !== null;
    
    if (pathSegments.length > 1) {
      const groupSegments = hasPageAtEnd ? pathSegments.slice(0, -1) : pathSegments;
      if (groupSegments.length > 0) {
        // Decode each segment and join with / to match internal path format
        groupPath = groupSegments.map(decodePathSegment).join('/');
      }
    } else if (!hasPageAtEnd) {
      // Single segment that's not a page - it's a group, so decode it
      groupPath = decodePathSegment(lastSegment);
    }

    // Validate the group path exists
    if (groupPath !== 'root' && !(groupPath in groupMetadata)) {
      applySelection(defaultPath, defaultPageNum);
      navigateToPreviewUrl(buildPreviewUrl(documentId, defaultPath, defaultPageNum, pageTitles), 'replace');
      return;
    }

    const pages = getPagesInPath(groupPath, pageAssignments);
    
    if (hasPageAtEnd && pageNum !== null) {
      // Page is specified
      if (pages.includes(pageNum)) {
        applySelection(groupPath, pageNum);
      } else {
        applySelection(defaultPath, defaultPageNum);
        navigateToPreviewUrl(buildPreviewUrl(documentId, defaultPath, defaultPageNum, pageTitles), 'replace');
      }
    } else if (pages.length > 0) {
      const firstPageInGroup = pages[0];
      applySelection(groupPath, firstPageInGroup);
      navigateToPreviewUrl(buildPreviewUrl(documentId, groupPath, firstPageInGroup, pageTitles), 'replace');
    } else {
      applySelection(defaultPath, defaultPageNum);
      navigateToPreviewUrl(buildPreviewUrl(documentId, defaultPath, defaultPageNum, pageTitles), 'replace');
    }
  }, [pageAssignments, params.path, params.documentId, groupMetadata, pageTitles, pathname, router]);

  const handlePathClick = (path: string) => {
    const pages = getPagesInPath(path, pageAssignments);
    if (pages.length > 0) {
      setPageRange({
        start: pages[0],
        end: pages[pages.length - 1],
        title: path === 'root' ? 'Cover' : (groupMetadata[path]?.title || 'Page'),
      });
      setCurrentPageNum(pages[0]);
      setSelectedPath(path);
      updateExpandedPaths(path);
      
      const documentId = (params.documentId as string) || '';
      navigateToPreviewUrl(buildPreviewUrl(documentId, path, pages[0], pageTitles));
    }
  };

  const handlePageClick = (path: string, pageNum: number) => {
    setSelectedPath(path);
    setCurrentPageNum(pageNum);
    const pages = getPagesInPath(path, pageAssignments);
    if (pages.length > 0) {
      setPageRange({
        start: pages[0],
        end: pages[pages.length - 1],
        title: path === 'root' ? 'Cover' : (groupMetadata[path]?.title || 'Page'),
      });
    }
    updateExpandedPaths(path);
    
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
            const isActive = selectedPath === parentPath && currentPageNum === pageNum;
            return (
              <div key={`page-${pageNum}`} style={{ paddingLeft: `${depth * 12}px` }} className="mr-6">
                <button
                  onClick={() => handlePageClick(parentPath, pageNum)}
                  className={`w-full text-left text-sm py-2 px-3 transition-colors border-r-4 truncate ${isActive ? 'font-bold' : 'hover:cursor-pointer'}`}
                  style={{
                    color: primaryColor,
                    borderRightColor: isActive ? componentColor : 'transparent',
                    backgroundColor: isActive ? `${componentColor}14` : 'transparent',
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
          const isGroupActive = selectedPath === path;

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
                    className={`flex-1 text-left text-sm py-2 px-2 transition-colors border-r-4 truncate ${isGroupActive ? 'font-bold' : 'hover:cursor-pointer'}`}
                    style={{
                      color: primaryColor,
                      borderRightColor: isGroupActive ? componentColor : 'transparent',
                      backgroundColor: isGroupActive ? `${componentColor}14` : 'transparent',
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
    <div className="flex flex-col h-screen" style={{ color: primaryColor, backgroundColor, ['--component-color' as any]: componentColor }}>
      {/* Header */}
      <div className="px-16 py-4 pt-8">
        <div className="max-w-full mx-auto">
          <div className="flex items-start justify-between gap-4">
            <div className="flex-1">
              <h1 className="text-4xl font-bold" style={{ color: primaryColor }}>
                {pdfFileName ? pdfFileName.replace(/\.pdf$/i, '') : 'Catalog'}
              </h1>
              <div className="flex items-center justify-between mt-4 gap-4">
                    <p className="text-xl " style={{ color: primaryColor }}>{documentId}</p>
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
        <div className="flex-1 flex flex-col overflow-hidden py-4 px-16" style={{ backgroundColor }}>
          {/* Title Section */}
          <div className="mb-6">
            <h2 className="text-3xl font-bold" style={{ color: primaryColor }}>
              {pageTitles[currentPageNum - 1] || `Page ${currentPageNum}`}
            </h2>
          </div>

          {/* PDF Viewer */}
          <div className="flex-1 overflow-hidden flex flex-col">
            <div className="flex-1 overflow-hidden">
              <PDFViewer
                pdfUrl={pdfUrl}
                currentPage={currentPageNum}
                onTotalPagesChange={() => {}}
                onInternalLinkClick={(pageNum) => setCurrentPageNum(pageNum)}
              />
            </div>

            {/* Page Navigation - Only show for groups */}
            {isGroupSelected && (
              <div className="flex items-center justify-center gap-6 mt-4 pb-4">
                <button
                  onClick={() => {
                    const newPage = Math.max(pageRange.start, currentPageNum - 1);
                    setCurrentPageNum(newPage);
                    setSelectedPath(selectedPath);
                    updateExpandedPaths(selectedPath);
                    
                    const documentId = (params.documentId as string) || '';
                    navigateToPreviewUrl(buildPreviewUrl(documentId, selectedPath, newPage, pageTitles));
                  }}
                  disabled={currentPageNum <= pageRange.start}
                  className="p-2 rounded-lg disabled:opacity-30 disabled:cursor-not-allowed transition-colors text-2xl"
                  style={{ color: primaryColor, backgroundColor: 'transparent' }}
                >
                  &lt;
                </button>
                <span className="text-sm font-medium min-w-12 text-center" style={{ color: primaryColor }}>
                  {currentIndex + 1} / {totalPagesInRange}
                </span>
                <button
                  onClick={() => {
                    const newPage = Math.min(pageRange.end, currentPageNum + 1);
                    setCurrentPageNum(newPage);
                    setSelectedPath(selectedPath);
                    updateExpandedPaths(selectedPath);
                    
                    const documentId = (params.documentId as string) || '';
                    navigateToPreviewUrl(buildPreviewUrl(documentId, selectedPath, newPage, pageTitles));
                  }}
                  disabled={currentPageNum >= pageRange.end}
                  className="p-2 rounded-lg disabled:opacity-30 disabled:cursor-not-allowed transition-colors text-2xl"
                  style={{ color: primaryColor, backgroundColor: 'transparent' }}
                >
                  &gt;
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
