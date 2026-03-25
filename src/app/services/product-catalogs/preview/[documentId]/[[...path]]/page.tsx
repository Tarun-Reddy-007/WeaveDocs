'use client';

import { useState, useEffect, useRef } from 'react';
import { useParams, usePathname, useRouter } from 'next/navigation';
import dynamic from 'next/dynamic';
import { useHierarchy } from '@/lib/HierarchyContext';
import type { ParsedHtmlCatalog } from '@/lib/indesign-parser';

const PDFViewer = dynamic(() => import('@/components/PDFViewer').then(mod => mod.PDFViewer), { ssr: false });
const HTMLPageViewer = dynamic(() => import('@/components/HTMLPageViewer').then(mod => mod.HTMLPageViewer), { ssr: false });

// ── Icons ─────────────────────────────────────────────────────────────────────
const IconShare = ({ color }: { color: string }) => (
  <svg viewBox="0 0 16 16" className="w-4 h-4 flex-shrink-0" fill="none" stroke={color} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="13" cy="3" r="1.5" /><circle cx="13" cy="13" r="1.5" /><circle cx="3" cy="8" r="1.5" />
    <path d="M4.5 7.1L11.5 3.9M4.5 8.9L11.5 12.1" />
  </svg>
);
const IconDownload = ({ color }: { color: string }) => (
  <svg viewBox="0 0 16 16" className="w-4 h-4 flex-shrink-0" fill="none" stroke={color} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
    <path d="M8 2v8M5 7l3 3 3-3" /><path d="M2 12h12" />
  </svg>
);
const IconChevron = ({ open, color }: { open: boolean; color: string }) => (
  <svg viewBox="0 0 10 10" className={`w-2.5 h-2.5 flex-shrink-0 transition-transform duration-150 ${open ? 'rotate-90' : ''}`} fill={color}>
    <path d="M3 1.5l4 3.5-4 3.5V1.5z" />
  </svg>
);
// ─────────────────────────────────────────────────────────────────────────────

interface PageRange { start: number; end: number; title: string; }

let mobileTabsScrollMemory = 0;
let desktopContentsScrollMemory = 0;

function getPagesInPath(path: string, assignments: Record<number, string>): number[] {
  return Object.entries(assignments).filter(([, p]) => p === path).map(([n]) => parseInt(n, 10)).sort((a, b) => a - b);
}
function getChildPaths(parentPath: string, metadata: Record<string, { title: string }>): string[] {
  const prefix = parentPath === 'root' ? '' : `${parentPath}/`;
  const children = new Set<string>();
  Object.keys(metadata).forEach(path => {
    if (path === 'root') return;
    if (prefix === '' && !path.includes('/')) children.add(path);
    else if (prefix && path.startsWith(prefix) && !path.slice(prefix.length).includes('/')) children.add(path);
  });
  return Array.from(children).sort();
}
function getMinPageInPath(path: string, assignments: Record<number, string>, metadata: Record<string, { title: string }>): number {
  const direct = getPagesInPath(path, assignments);
  if (direct.length > 0) return Math.min(...direct);
  const mins = getChildPaths(path, metadata).map(cp => getMinPageInPath(cp, assignments, metadata)).filter(isFinite);
  return mins.length > 0 ? Math.min(...mins) : Infinity;
}
function encodePathSegment(s: string) { return encodeURIComponent(s); }
function decodePathSegment(s: string) { return decodeURIComponent(s); }
function getAncestorPaths(path: string): string[] {
  if (path === 'root') return ['root'];
  const segs = path.split('/');
  const out = ['root'];
  for (let i = 0; i < segs.length; i++) out.push(segs.slice(0, i + 1).join('/'));
  return out;
}
function isPathAGroup(path: string, metadata: Record<string, { title: string }>): boolean {
  return getChildPaths(path, metadata).length > 0;
}
function getAllPagesInPathRecursive(path: string, assignments: Record<number, string>, metadata: Record<string, { title: string }>): number[] {
  const direct = getPagesInPath(path, assignments);
  const childPaths = getChildPaths(path, metadata);
  const items: Array<{ type: 'page' | 'group'; pageNum?: number; path?: string; minPage?: number }> = [];
  direct.forEach(n => items.push({ type: 'page', pageNum: n, minPage: n }));
  childPaths.forEach(cp => items.push({ type: 'group', path: cp, minPage: getMinPageInPath(cp, assignments, metadata) }));
  items.sort((a, b) => (a.minPage ?? Infinity) - (b.minPage ?? Infinity));
  const result: number[] = [];
  items.forEach(item => {
    if (item.type === 'page') result.push(item.pageNum!);
    else if (item.path) result.push(...getAllPagesInPathRecursive(item.path, assignments, metadata));
  });
  return result;
}
function buildPreviewUrl(docId: string, path: string, pageNum: number, titles: string[]): string {
  const pageTitle = titles[pageNum - 1] || `Page ${pageNum}`;
  const encodedTitle = encodePathSegment(pageTitle);
  if (path === 'root') return `/services/product-catalogs/preview/${docId}/${encodedTitle}`;
  return `/services/product-catalogs/preview/${docId}/${path.split('/').map(encodePathSegment).join('/')}/${encodedTitle}`;
}

// Build a flat ordered list of all nav items for the mobile tab strip
type NavItem = { type: 'page' | 'group'; label: string; path: string; pageNum?: number; };

function buildFlatNavItems(
  parentPath: string,
  assignments: Record<number, string>,
  metadata: Record<string, { title: string }>,
  pageTitles: string[],
): NavItem[] {
  const childPaths = getChildPaths(parentPath, metadata);
  const pages = getPagesInPath(parentPath, assignments);
  const items: Array<{ type: 'page' | 'group'; pageNum?: number; path?: string; minPage?: number }> = [];
  pages.forEach(n => items.push({ type: 'page', pageNum: n, minPage: n }));
  childPaths.forEach(cp => items.push({ type: 'group', path: cp, minPage: getMinPageInPath(cp, assignments, metadata) }));
  items.sort((a, b) => (a.minPage ?? Infinity) - (b.minPage ?? Infinity));

  const result: NavItem[] = [];
  items.forEach(item => {
    if (item.type === 'page') {
      const pageNum = item.pageNum!;
      result.push({ type: 'page', label: pageTitles[pageNum - 1] || `Page ${pageNum}`, path: parentPath, pageNum });
    } else if (item.path) {
      const title = metadata[item.path]?.title || 'Group';
      result.push({ type: 'group', label: title, path: item.path });
      // Also add children recursively
      result.push(...buildFlatNavItems(item.path, assignments, metadata, pageTitles));
    }
  });
  return result;
}

// ── PageStackItem ─────────────────────────────────────────────────────────────
interface PageStackItemProps {
  pageNum: number;
  sourceType: 'pdf' | 'html' | null;
  pdfUrl: string | null;
  htmlCatalog: ParsedHtmlCatalog | null;
  pageTitles: string[];
  primaryColor: string;
  componentColor: string;
  pageHeightsRef: React.MutableRefObject<Map<number, { top: number; height: number }>>;
  pdfContainerRef: React.RefObject<HTMLDivElement | null>;
  selectedPath: string;
  params: ReturnType<typeof useParams>;
  navigateToPreviewUrl: (url: string) => void;
  setCurrentPageNum: (n: number) => void;
  onInternalLinkClick?: (n: number) => void;
}

function PageStackItem({ pageNum, sourceType, pdfUrl, htmlCatalog, pageTitles, primaryColor, componentColor, pageHeightsRef, pdfContainerRef, onInternalLinkClick }: PageStackItemProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const ro = new ResizeObserver(() => {
      if (containerRef.current && pdfContainerRef.current) {
        const rect = containerRef.current.getBoundingClientRect();
        const parentRect = pdfContainerRef.current.getBoundingClientRect();
        pageHeightsRef.current.set(pageNum, {
          top: rect.top - parentRect.top + pdfContainerRef.current.scrollTop,
          height: rect.height,
        });
      }
    });
    if (containerRef.current) ro.observe(containerRef.current);
    return () => ro.disconnect();
  }, [pageNum, pageHeightsRef, pdfContainerRef]);

  return (
    <div ref={containerRef} className="mb-10 w-full">
      <div className="w-full" style={{ boxShadow: '0 2px 16px 0 rgba(0,0,0,0.08)' }}>
        {sourceType === 'pdf' ? (
          <PDFViewer
            pdfUrl={pdfUrl}
            currentPage={pageNum}
            pageTitle={pageTitles[pageNum - 1] || `Page ${pageNum}`}
            onTotalPagesChange={() => {}}
            onInternalLinkClick={onInternalLinkClick}
            fitToContainer={false}
          />
        ) : htmlCatalog ? (
          <div className="w-full bg-gray-50">
            <HTMLPageViewer
              page={htmlCatalog.pages[pageNum - 1]}
              pageTitle={pageTitles[pageNum - 1] || htmlCatalog.pages[pageNum - 1]?.title}
              renderMode="dom"
              fillContainer={true}
            />
          </div>
        ) : null}
      </div>
    </div>
  );
}
// ─────────────────────────────────────────────────────────────────────────────

export default function PreviewPage() {
  const params = useParams();
  const pathname = usePathname();
  const router = useRouter();
  const { sourceType, pdfUrl, htmlCatalog, pageAssignments, groupMetadata, pageTitles, pdfFileName, sourceFileName, docName, themeColors } = useHierarchy();

  const [currentPageNum, setCurrentPageNum] = useState(1);
  const [expandedPaths, setExpandedPaths] = useState<Set<string>>(new Set(['root']));
  const [pageRange, setPageRange] = useState<PageRange | null>(null);
  const [selectedPath, setSelectedPath] = useState<string>('root');
  const [pagesInSelectedPath, setPagesInSelectedPath] = useState<number[]>([]);
  const [viewingPathDuringScroll, setViewingPathDuringScroll] = useState<string>('root');
  const [hasInitialized, setHasInitialized] = useState(false);
  const [copied, setCopied] = useState(false);

  // Mobile tab strip state
  const [mobileNavIndex, setMobileNavIndex] = useState(0);
  const mobileTabsRef = useRef<HTMLDivElement>(null);
  const desktopContentsRef = useRef<HTMLDivElement>(null);

  const pdfContainerRef = useRef<HTMLDivElement>(null);
  const pageHeightsRef = useRef<Map<number, { top: number; height: number }>>(new Map());
  const pageToPathMapRef = useRef<Map<number, string>>(new Map());

  const primaryColor    = themeColors?.primaryColor    || '#0f172a';
  const componentColor  = themeColors?.componentColor   || '#22c55e';
  const backgroundColor = themeColors?.backgroundColor  || '#f3f4f6';
  const fontStyle       = themeColors?.fontStyle        || 'inherit';

  const updateExpandedPaths = (path: string) => {
    setExpandedPaths(prev => { const n = new Set(prev); getAncestorPaths(path).forEach(a => n.add(a)); return n; });
  };
  const navigateToPreviewUrl = (url: string, mode: 'push' | 'replace' = 'push') => {
    if (pathname === url) return;
    mode === 'replace' ? router.replace(url) : router.push(url);
  };
  const getPagesToShowForPath = (path: string): number[] => {
    if (path === 'root') return getPagesInPath('root', pageAssignments);
    if (isPathAGroup(path, groupMetadata)) return getAllPagesInPathRecursive(path, pageAssignments, groupMetadata);
    return getPagesInPath(path, pageAssignments);
  };
  const buildPathMap = (startPath: string) => {
    const map = new Map<number, string>();
    const recurse = (p: string) => {
      getPagesInPath(p, pageAssignments).forEach(n => map.set(n, p));
      getChildPaths(p, groupMetadata).forEach(cp => recurse(cp));
    };
    recurse(startPath);
    return map;
  };

  // Flat nav items for mobile carousel
  const flatNavItems = Object.keys(pageAssignments).length > 0
    ? buildFlatNavItems('root', pageAssignments, groupMetadata, pageTitles)
    : [];

  // Sync mobileNavIndex with selectedPath / currentPageNum
  useEffect(() => {
    if (flatNavItems.length === 0) return;
    const idx = flatNavItems.findIndex(item =>
      item.type === 'page'
        ? item.path === selectedPath && item.pageNum === currentPageNum
        : item.path === selectedPath
    );
    if (idx !== -1) setMobileNavIndex(idx);
  }, [selectedPath, currentPageNum, flatNavItems.length]);

  // Restore mobile tabs horizontal scroll position after navigation changes.
  useEffect(() => {
    if (!mobileTabsRef.current || flatNavItems.length === 0) return;
    requestAnimationFrame(() => {
      if (mobileTabsRef.current) mobileTabsRef.current.scrollLeft = mobileTabsScrollMemory;
    });
  }, [flatNavItems.length, selectedPath, currentPageNum]);

  // Init
  useEffect(() => {
    if (Object.keys(pageAssignments).length === 0 || hasInitialized) return;
    const pathSegments = (params.path as string[]) || [];
    const documentId = (params.documentId as string) || '';
    const defaultPageNum = 1;
    const defaultPath = pageAssignments[defaultPageNum] || 'root';

    let pathToShow = defaultPath, pageToShow = defaultPageNum;
    let pagesToShow: number[] = [];

    if (pathSegments.length === 0) {
      pathToShow = defaultPath; pageToShow = defaultPageNum; pagesToShow = [defaultPageNum];
    } else {
      const lastSeg = decodePathSegment(pathSegments[pathSegments.length - 1]);
      let foundPage: number | null = null;
      for (let i = 0; i < pageTitles.length; i++) {
        if ((pageTitles[i] || `Page ${i + 1}`) === lastSeg) { foundPage = i + 1; break; }
      }
      let groupPath = 'root';
      if (foundPage !== null) {
        if (pathSegments.length > 1) groupPath = pathSegments.slice(0, -1).map(decodePathSegment).join('/');
      } else if (lastSeg in groupMetadata) {
        groupPath = pathSegments.map(decodePathSegment).join('/');
      } else {
        groupPath = pathSegments.map(decodePathSegment).join('/');
        if (!(groupPath in groupMetadata) && groupPath !== 'root') groupPath = 'root';
      }
      if (groupPath !== 'root' && !(groupPath in groupMetadata)) {
        pathToShow = defaultPath; pageToShow = defaultPageNum; pagesToShow = [defaultPageNum];
      } else {
        pathToShow = groupPath; pageToShow = foundPage || defaultPageNum;
        pagesToShow = foundPage !== null ? [foundPage] : getPagesToShowForPath(groupPath);
      }
    }

    pageToPathMapRef.current = buildPathMap(pathToShow);
    const validPage = pagesToShow.includes(pageToShow) ? pageToShow : pagesToShow[0] || pageToShow;
    setPagesInSelectedPath(pagesToShow); setCurrentPageNum(validPage);
    setSelectedPath(pathToShow); setViewingPathDuringScroll(pathToShow);
    setPageRange({ start: pagesToShow[0] || validPage, end: pagesToShow[pagesToShow.length - 1] || validPage, title: pathToShow === 'root' ? 'Cover' : (groupMetadata[pathToShow]?.title || 'Page') });
    updateExpandedPaths(pathToShow); setHasInitialized(true);
  }, [pageAssignments, groupMetadata, pageTitles, params.documentId]);

  // Scroll tracking
  useEffect(() => {
    if (!pdfContainerRef.current || pagesInSelectedPath.length === 0 || !hasInitialized) return;
    const container = pdfContainerRef.current;
    const handleScroll = () => {
      if (!pdfContainerRef.current) return;
      const scrollTop = pdfContainerRef.current.scrollTop;
      const center = scrollTop + pdfContainerRef.current.clientHeight / 2;
      let closest = pagesInSelectedPath[0], closestDist = Infinity;
      pagesInSelectedPath.forEach(n => {
        const info = pageHeightsRef.current.get(n);
        if (info) {
          const dist = Math.abs(info.top + info.height / 2 - center);
          if (dist < closestDist) { closestDist = dist; closest = n; }
        }
      });
      if (closest !== currentPageNum) {
        setCurrentPageNum(closest);
        setViewingPathDuringScroll(pageToPathMapRef.current.get(closest) || selectedPath);
      }
    };
    container.addEventListener('scroll', handleScroll, { passive: true });
    return () => container.removeEventListener('scroll', handleScroll);
  }, [pagesInSelectedPath, currentPageNum, hasInitialized]);

  const handlePathClick = (path: string) => {
    if (desktopContentsRef.current) {
      desktopContentsScrollMemory = desktopContentsRef.current.scrollTop;
    }
    pageToPathMapRef.current = buildPathMap(path);
    const pagesToShow = getPagesToShowForPath(path);
    if (pagesToShow.length === 0) return;
    const firstPage = pagesToShow[0];
    setPagesInSelectedPath(pagesToShow);
    setPageRange({ start: pagesToShow[0], end: pagesToShow[pagesToShow.length - 1], title: path === 'root' ? 'Cover' : (groupMetadata[path]?.title || 'Page') });
    setCurrentPageNum(firstPage); setSelectedPath(path); setViewingPathDuringScroll(path);
    updateExpandedPaths(path);
    if (pdfContainerRef.current) pdfContainerRef.current.scrollTop = 0;
    const documentId = (params.documentId as string) || '';
    let url = `/services/product-catalogs/preview/${documentId}`;
    if (path !== 'root') url += `/${path.split('/').map(encodePathSegment).join('/')}`;
    else url += `/${encodePathSegment(pageTitles[firstPage - 1] || `Page ${firstPage}`)}`;
    navigateToPreviewUrl(url);
  };

  const handlePageClick = (path: string, pageNum: number) => {
    if (desktopContentsRef.current) {
      desktopContentsScrollMemory = desktopContentsRef.current.scrollTop;
    }
    pageToPathMapRef.current = buildPathMap(path);
    setPagesInSelectedPath([pageNum]); setSelectedPath(path); setCurrentPageNum(pageNum);
    setViewingPathDuringScroll(path);
    setPageRange({ start: pageNum, end: pageNum, title: pageTitles[pageNum - 1] || `Page ${pageNum}` });
    updateExpandedPaths(path);
    if (pdfContainerRef.current) pdfContainerRef.current.scrollTop = 0;
    navigateToPreviewUrl(buildPreviewUrl((params.documentId as string) || '', path, pageNum, pageTitles));
  };

  // Mobile tab navigation
  const handleMobileNavItem = (item: NavItem) => {
    if (mobileTabsRef.current) {
      mobileTabsScrollMemory = mobileTabsRef.current.scrollLeft;
    }
    if (item.type === 'page' && item.pageNum !== undefined) {
      handlePageClick(item.path, item.pageNum);
    } else {
      handlePathClick(item.path);
    }
  };

  // Keep desktop Contents panel at its current scroll position after nav interactions.
  useEffect(() => {
    if (!desktopContentsRef.current) return;
    desktopContentsRef.current.scrollTop = desktopContentsScrollMemory;
  }, [selectedPath, currentPageNum]);

  const handleCopyLink = () => {
    let link = `${window.location.origin}/services/product-catalogs/preview/${params.documentId}`;
    if (selectedPath !== 'root') link += `/${selectedPath.split('/').map(encodePathSegment).join('/')}`;
    link += `/${encodePathSegment(pageTitles[currentPageNum - 1] || `Page ${currentPageNum}`)}`;
    navigator.clipboard.writeText(link).then(() => { setCopied(true); setTimeout(() => setCopied(false), 2000); });
  };

  const handleDownload = () => {
    if (sourceType !== 'pdf' || !pdfUrl) return;
    const a = document.createElement('a'); a.href = pdfUrl; a.download = pdfFileName || 'catalog.pdf';
    document.body.appendChild(a); a.click(); document.body.removeChild(a);
  };

  const renderHierarchy = (parentPath = 'root', depth = 0): React.ReactNode => {
    const childPaths = getChildPaths(parentPath, groupMetadata);
    const pages = getPagesInPath(parentPath, pageAssignments);
    const items: Array<{ type: 'page' | 'group'; pageNum?: number; path?: string; minPage?: number }> = [];
    pages.forEach(n => items.push({ type: 'page', pageNum: n, minPage: n }));
    childPaths.forEach(cp => items.push({ type: 'group', path: cp, minPage: getMinPageInPath(cp, pageAssignments, groupMetadata) }));
    items.sort((a, b) => (a.minPage ?? Infinity) - (b.minPage ?? Infinity));

    return (
      <div>
        {items.map(item => {
          if (item.type === 'page') {
            const pageNum = item.pageNum!;
            const isViewing = viewingPathDuringScroll === parentPath && currentPageNum === pageNum;
            const isSelected = selectedPath === parentPath && currentPageNum === pageNum;
            const active = isSelected || isViewing;
            return (
              <div key={`page-${pageNum}`} style={{ paddingLeft: `${depth * 16 + 16}px` }}>
                <button
                  onClick={() => handlePageClick(parentPath, pageNum)}
                  className="w-full text-left py-2 pr-4 text-sm transition-all duration-150"
                  style={{
                    color: active ? componentColor : primaryColor,
                    fontWeight: active ? 600 : 400,
                    opacity: active ? 1 : 0.7,
                    borderRight: `3px solid ${active ? componentColor : 'transparent'}`,
                    fontFamily: fontStyle,
                  }}
                >
                  {pageTitles[pageNum - 1] || `Title ${pageNum}`}
                </button>
              </div>
            );
          }

          const path = item.path!;
          const title = groupMetadata[path]?.title || 'Group';
          const groupPages = getPagesInPath(path, pageAssignments);
          const subGroups = getChildPaths(path, groupMetadata);
          const hasChildren = subGroups.length > 0 || groupPages.length > 0;
          const isExpanded = expandedPaths.has(path);
          const isSelected = selectedPath === path;
          const isInBreadcrumb = getAncestorPaths(viewingPathDuringScroll).includes(path);
          const active = isSelected || isInBreadcrumb;

          return (
            <div key={path}>
              <div style={{ paddingLeft: `${depth * 16}px` }}>
                <div className="flex items-center transition-all duration-150" style={{ borderRight: `3px solid ${active ? componentColor : 'transparent'}` }}>
                  <button
                    onClick={() => setExpandedPaths(prev => { const n = new Set(prev); n.has(path) ? n.delete(path) : n.add(path); return n; })}
                    className="flex-shrink-0 w-8 h-9 flex items-center justify-center"
                  >
                    {hasChildren ? <IconChevron open={isExpanded} color={active ? componentColor : primaryColor} /> : <span className="w-2.5" />}
                  </button>
                  <button
                    onClick={() => handlePathClick(path)}
                    className="flex-1 text-left py-2 pr-4 text-sm transition-all duration-150 min-w-0 truncate"
                    style={{ color: active ? componentColor : primaryColor, fontWeight: active ? 600 : 500, opacity: active ? 1 : 0.85, fontFamily: fontStyle }}
                  >
                    {title}
                  </button>
                </div>
              </div>
              {isExpanded && hasChildren && renderHierarchy(path, depth + 1)}
            </div>
          );
        })}
      </div>
    );
  };

  // ── Empty state ──────────────────────────────────────────────────────────
  if (Object.keys(pageAssignments).length === 0) {
    return (
      <div className="w-full h-screen flex flex-col items-center justify-center gap-4" style={{ backgroundColor }}>
        <svg viewBox="0 0 48 48" className="w-12 h-12" style={{ opacity: 0.2 }} fill="none" stroke={primaryColor} strokeWidth="1.5">
          <rect x="8" y="6" width="32" height="36" rx="2" /><path d="M16 16h16M16 22h16M16 28h10" strokeLinecap="round" />
        </svg>
        <p className="text-sm" style={{ color: primaryColor, opacity: 0.4, fontFamily: fontStyle }}>No catalog loaded.</p>
      </div>
    );
  }

  const documentId = (params.documentId as string) || '';
  const catalogName = docName || (sourceFileName ? sourceFileName.replace(/\.(pdf|zip|html?)$/i, '') : 'Catalog');
  const currentTitle = pageTitles[currentPageNum - 1] || `Page ${currentPageNum}`;

  return (
    <div
      className="flex flex-col h-screen overflow-hidden"
      style={{ backgroundColor, color: primaryColor, fontFamily: fontStyle }}
    >

      {/* ── Top accent bar ── */}
      <div className="flex-shrink-0 h-1" style={{ backgroundColor: componentColor }} />

      {/* ── Header ── */}
      <div
        className="flex-shrink-0 border-b px-5 md:px-12 lg:px-16 py-4 md:py-5"
        style={{ borderColor: `${primaryColor}15`, backgroundColor }}
      >
        <div className="flex items-start justify-between gap-4">
          <div className="flex-1 min-w-0">
            <h1
              className="text-xl md:text-3xl lg:text-4xl font-bold leading-tight mb-0.5 truncate"
              style={{ color: primaryColor, fontFamily: fontStyle }}
            >
              {catalogName}
            </h1>
            {documentId && (
              <p className="text-xs md:text-sm" style={{ color: primaryColor, opacity: 0.4, fontFamily: fontStyle }}>
                {documentId}
              </p>
            )}
          </div>
          <div className="flex items-center gap-2 flex-shrink-0 mt-0.5">
            <button
              onClick={handleCopyLink}
              className="flex items-center gap-1.5 px-1 py-1 text-base md:text-[1.05rem] font-medium transition-colors duration-150 rounded hover:opacity-80"
              style={{ color: '#0070B8' }}
            >
              <IconShare color="#0070B8" />
              <span className="hidden sm:inline">{copied ? 'Copied!' : 'Share'}</span>
            </button>
            <button
              onClick={handleDownload}
              disabled={sourceType !== 'pdf'}
              className="flex items-center gap-1.5 px-1 py-1 text-base md:text-[1.05rem] font-medium transition-colors duration-150 rounded hover:opacity-80"
              style={{ color: sourceType === 'pdf' ? '#0070B8' : `${primaryColor}55` }}
            >
              <IconDownload color={sourceType === 'pdf' ? '#0070B8' : `${primaryColor}`} />
              <span className="hidden sm:inline">{sourceType === 'pdf' ? 'Download PDF' : 'HTML loaded locally'}</span>
            </button>
          </div>
        </div>
      </div>

      {/* ── Mobile tab strip (under header) ── */}
      {flatNavItems.length > 0 && (
        <div
          className="md:hidden flex-shrink-0 border-b mb-2"
          style={{ borderColor: `${primaryColor}15`, backgroundColor }}
        >
          <div
            ref={mobileTabsRef}
            onScroll={() => {
              if (mobileTabsRef.current) {
                mobileTabsScrollMemory = mobileTabsRef.current.scrollLeft;
              }
            }}
            className="overflow-x-auto overflow-y-hidden"
            style={{ scrollbarWidth: 'thin', scrollbarColor: '#9ca3af transparent' }}
          >
            <div className="inline-flex min-w-max items-stretch gap-1 px-2 py-2">
              {flatNavItems.map((item, idx) => {
                const isActive = idx === mobileNavIndex;
                return (
                <button
                  key={`${item.type}-${item.path}-${item.pageNum ?? 'group'}-${idx}`}
                  onClick={() => {
                    setMobileNavIndex(idx);
                    handleMobileNavItem(item);
                  }}
                  className="h-10 px-3 min-w-[96px] max-w-[180px] flex-shrink-0 relative border-b-2 transition-all duration-150"
                  style={{
                    color: primaryColor,
                    fontFamily: fontStyle,
                    opacity: isActive ? 1 : 0.5,
                    borderBottomColor: isActive ? componentColor : 'transparent',
                  }}
                >
                  <span className={`text-sm truncate block ${isActive ? 'font-semibold' : 'font-medium'}`}>
                    {item.label}
                  </span>
                </button>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* ── Body ── */}
      <div className="flex flex-1 overflow-hidden">

        {/* ── Desktop sidebar ── */}
        <div
          className="hidden md:flex w-64 lg:w-80 flex-shrink-0 flex-col border-r overflow-hidden"
          style={{ borderColor: `${primaryColor}15`, backgroundColor }}
        >
          <div
            className="flex-shrink-0 h-10 flex items-center pl-10 lg:pl-11 pr-5 border-b"
            style={{ borderColor: `${primaryColor}10` }}
          >
            <span className="text-xs tracking-widest uppercase font-semibold" style={{ color: primaryColor, opacity: 0.35 }}>Contents</span>
          </div>
          <div
            ref={desktopContentsRef}
            onScroll={() => {
              if (desktopContentsRef.current) {
                desktopContentsScrollMemory = desktopContentsRef.current.scrollTop;
              }
            }}
            className="flex-1 overflow-y-auto py-3"
            style={{ scrollbarWidth: 'thin', scrollbarColor: '#9ca3af transparent' }}
          >
            <nav className="pl-10 lg:pl-11">{renderHierarchy()}</nav>
          </div>
        </div>

        {/* ── Main content ── */}
        <div className="flex-1 flex flex-col overflow-hidden min-w-0">

          {/* Desktop: slim title + page counter strip */}
          <div
            className="hidden md:flex flex-shrink-0 h-11 items-center justify-between px-8 lg:px-12 border-b"
            style={{ borderColor: `${primaryColor}10` }}
          >
            <div className="flex items-center gap-2 min-w-0 flex-1">
              {selectedPath !== 'root' && (
                <>
                  <span className="text-xs truncate max-w-[120px]" style={{ color: primaryColor, opacity: 0.35 }}>
                    {groupMetadata[selectedPath]?.title || selectedPath.split('/').pop()}
                  </span>
                  <span style={{ color: primaryColor, opacity: 0.2 }} className="text-xs">/</span>
                </>
              )}
              <span className="text-sm font-semibold truncate" style={{ color: primaryColor, fontFamily: fontStyle }}>
                {currentTitle}
              </span>
            </div>
            {pagesInSelectedPath.length > 1 && (
              <span
                className="flex-shrink-0 text-xs font-mono ml-3 px-2 py-0.5 rounded"
                style={{ color: primaryColor, opacity: 0.35, backgroundColor: `${primaryColor}08` }}
              >
                {currentPageNum} / {pagesInSelectedPath[pagesInSelectedPath.length - 1]}
              </span>
            )}
          </div>

          {/* PDF area */}
          <div className="flex-1 overflow-hidden">
            {pagesInSelectedPath.length > 1 ? (
              <div
                ref={pdfContainerRef}
                className="h-full overflow-y-auto pt-5"
                style={{ scrollbarWidth: 'thin', scrollbarColor: '#9ca3af transparent' }}
              >
                <div className="flex flex-col w-full pb-4">
                  {pagesInSelectedPath.map(pageNum => (
                    <PageStackItem
                      key={`page-${pageNum}`}
                      pageNum={pageNum}
                      sourceType={sourceType}
                      pdfUrl={pdfUrl}
                      htmlCatalog={htmlCatalog}
                      pageTitles={pageTitles}
                      primaryColor={primaryColor}
                      componentColor={componentColor}
                      pageHeightsRef={pageHeightsRef}
                      pdfContainerRef={pdfContainerRef}
                      selectedPath={selectedPath}
                      params={params}
                      navigateToPreviewUrl={navigateToPreviewUrl}
                      setCurrentPageNum={setCurrentPageNum}
                      onInternalLinkClick={n => {
                        if (pagesInSelectedPath.includes(n)) {
                          setCurrentPageNum(n);
                          navigateToPreviewUrl(buildPreviewUrl(documentId, pageToPathMapRef.current.get(n) || selectedPath, n, pageTitles));
                        }
                      }}
                    />
                  ))}
                </div>
              </div>
            ) : pagesInSelectedPath.length === 1 ? (
              <div className="h-full overflow-hidden">
                {sourceType === 'pdf' ? (
                  <PDFViewer
                    pdfUrl={pdfUrl}
                    currentPage={pagesInSelectedPath[0]}
                    pageTitle={pageTitles[pagesInSelectedPath[0] - 1] || `Page ${pagesInSelectedPath[0]}`}
                    onTotalPagesChange={() => {}}
                    onInternalLinkClick={n => {
                      setCurrentPageNum(n);
                      navigateToPreviewUrl(buildPreviewUrl(documentId, selectedPath, n, pageTitles));
                    }}
                    fitToContainer={false}
                  />
                ) : htmlCatalog ? (
                  <HTMLPageViewer
                    page={htmlCatalog.pages[pagesInSelectedPath[0] - 1]}
                    pageTitle={pageTitles[pagesInSelectedPath[0] - 1] || htmlCatalog.pages[pagesInSelectedPath[0] - 1]?.title}
                    renderMode="dom"
                    fillContainer={true}
                  />
                ) : null}
              </div>
            ) : null}
          </div>
        </div>
      </div>

    </div>
  );
}