'use client';

import { useState, useEffect, useRef } from 'react';
import { useParams, usePathname, useRouter } from 'next/navigation';
import { useHierarchy } from '@/lib/HierarchyContext';
import { DocumentHeader } from '../../components/DocumentHeader';
import { HierarchyPanel } from '../../components/HierarchyPanel';
import { PDFViewerContainer } from '../../components/PDFViewerContainer';
import {
  getPagesInPath,
  getChildPaths,
  getAncestorPaths,
  getPathForPage,
  isPathAGroup,
  getAllPagesInPathRecursive,
  encodePathSegment,
  decodePathSegment,
  buildPreviewUrl,
} from '../../lib/pageUtils';

interface PageRange {
  start: number;
  end: number;
  title: string;
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
    if (path === 'root') {
      return getPagesInPath('root', pageAssignments);
    }
    
    const isGroup = isPathAGroup(path, groupMetadata);
    if (isGroup) {
      return getAllPagesInPathRecursive(path, pageAssignments, groupMetadata);
    }
    
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
      pathToShow = defaultPath;
      pageToShow = defaultPageNum;
      pagesToShow = [defaultPageNum];
    } else {
      const lastSegment = pathSegments[pathSegments.length - 1];
      const decodedLastSegment = decodePathSegment(lastSegment);
      let foundPageNum: number | null = null;
      
      for (let i = 0; i < pageTitles.length; i++) {
        const title = pageTitles[i] || `Page ${i + 1}`;
        if (title === decodedLastSegment) {
          foundPageNum = i + 1;
          break;
        }
      }

      let groupPath = 'root';
      if (foundPageNum !== null) {
        if (pathSegments.length > 1) {
          const groupSegments = pathSegments.slice(0, -1);
          groupPath = groupSegments.map(decodePathSegment).join('/');
        }
      } else if (decodedLastSegment in groupMetadata) {
        groupPath = pathSegments.map(decodePathSegment).join('/');
        pageToShow = getPagesInPath(groupPath, pageAssignments)[0] || defaultPageNum;
      } else {
        groupPath = pathSegments.map(decodePathSegment).join('/');
        if (!(groupPath in groupMetadata) && groupPath !== 'root') {
          groupPath = 'root';
        }
      }

      if (groupPath !== 'root' && !(groupPath in groupMetadata)) {
        pathToShow = defaultPath;
        pageToShow = defaultPageNum;
        pagesToShow = [defaultPageNum];
      } else {
        pathToShow = groupPath;
        pageToShow = foundPageNum || defaultPageNum;
        
        if (foundPageNum !== null) {
          pagesToShow = [foundPageNum];
        } else {
          pagesToShow = getPagesToShowForPath(groupPath);
        }
      }
    }

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

  const handlePathClick = (path: string) => {
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
      
      const documentId = (params.documentId as string) || '';
      let groupUrl = `/services/product-catalogs/preview/${documentId}`;
      if (path !== 'root') {
        const encodedPath = path.split('/').map(encodePathSegment).join('/');
        groupUrl += `/${encodedPath}`;
      } else {
        const pageTitle = pageTitles[firstPage - 1] || `Page ${firstPage}`;
        const encodedTitle = encodePathSegment(pageTitle);
        groupUrl += `/${encodedTitle}`;
      }
      navigateToPreviewUrl(groupUrl);
    }
  };

  const handlePageClick = (path: string, pageNum: number) => {
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
    
    const documentId = (params.documentId as string) || '';
    navigateToPreviewUrl(buildPreviewUrl(documentId, path, pageNum, pageTitles));
  };

  const handleCopyLink = () => {
    const pageLink = `${window.location.origin}/services/product-catalogs/preview/${params.documentId}`;
    
    let fullLink = pageLink;
    if (selectedPath !== 'root') {
      const encodedPath = selectedPath.split('/').map(encodePathSegment).join('/');
      fullLink += `/${encodedPath}`;
    }
    
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

  return (
    <div className="flex flex-col h-screen" style={{ color: primaryColor, backgroundColor, fontFamily: fontStyle, ['--component-color' as any]: componentColor }}>
      {/* Header */}
      <DocumentHeader
        docName={docName}
        pdfFileName={pdfFileName}
        documentId={(params.documentId as string) || ''}
        primaryColor={primaryColor}
        fontStyle={fontStyle}
        currentPageNum={currentPageNum}
        selectedPath={selectedPath}
        pageTitles={pageTitles}
        pdfUrl={pdfUrl}
        onCopyLink={handleCopyLink}
        onDownloadCatalog={handleDownloadCatalog}
      />

      {/* Main Content */}
      <div className="flex flex-1 overflow-hidden">
        {/* Left Sidebar - Hierarchy */}
        <HierarchyPanel
          pageAssignments={pageAssignments}
          groupMetadata={groupMetadata}
          pageTitles={pageTitles}
          expandedPaths={expandedPaths}
          selectedPath={selectedPath}
          currentPageNum={currentPageNum}
          viewingPathDuringScroll={viewingPathDuringScroll}
          primaryColor={primaryColor}
          componentColor={componentColor}
          backgroundColor={backgroundColor}
          fontStyle={fontStyle}
          onPathClick={handlePathClick}
          onPageClick={handlePageClick}
          onExpandedPathsChange={setExpandedPaths}
        />

        {/* Right Content - PDF and Title */}
        <PDFViewerContainer
          pdfUrl={pdfUrl}
          pagesInSelectedPath={pagesInSelectedPath}
          currentPageNum={currentPageNum}
          pageTitles={pageTitles}
          selectedPath={selectedPath}
          primaryColor={primaryColor}
          componentColor={componentColor}
          backgroundColor={backgroundColor}
          fontStyle={fontStyle}
          pageHeightsRef={pageHeightsRef}
          pageToPathMapRef={pageToPathMapRef}
          onCurrentPageChange={setCurrentPageNum}
          onInternalLinkClick={(newPageNum) => {
            const pageActualPath = pageToPathMapRef.current.get(newPageNum) || selectedPath;
            const documentId = (params.documentId as string) || '';
            navigateToPreviewUrl(buildPreviewUrl(documentId, pageActualPath, newPageNum, pageTitles));
          }}
        />
      </div>
    </div>
  );
}
