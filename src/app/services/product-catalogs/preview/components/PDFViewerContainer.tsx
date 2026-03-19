'use client';

import { useRef, useEffect } from 'react';
import dynamic from 'next/dynamic';

const PDFViewer = dynamic(
  () => import('@/components/PDFViewer').then(mod => mod.PDFViewer),
  { ssr: false }
);

interface PageStackItemProps {
  pageNum: number;
  pdfUrl: string | null;
  pageTitles: string[];
  pageHeightsRef: React.MutableRefObject<Map<number, { top: number; height: number }>>;
  pdfContainerRef: React.RefObject<HTMLDivElement | null>;
  onInternalLinkClick?: (pageNum: number) => void;
}

function PageStackItem({
  pageNum,
  pdfUrl,
  pageTitles,
  pageHeightsRef,
  pdfContainerRef,
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

interface PDFViewerContainerProps {
  pdfUrl: string | null;
  pagesInSelectedPath: number[];
  currentPageNum: number;
  pageTitles: string[];
  selectedPath: string;
  primaryColor: string;
  componentColor: string;
  backgroundColor: string;
  fontStyle: string;
  pageHeightsRef: React.MutableRefObject<Map<number, { top: number; height: number }>>;
  pageToPathMapRef: React.MutableRefObject<Map<number, string>>;
  onCurrentPageChange: (pageNum: number) => void;
  onInternalLinkClick: (newPageNum: number) => void;
}

export function PDFViewerContainer({
  pdfUrl,
  pagesInSelectedPath,
  currentPageNum,
  pageTitles,
  selectedPath,
  primaryColor,
  componentColor,
  backgroundColor,
  fontStyle,
  pageHeightsRef,
  pageToPathMapRef,
  onCurrentPageChange,
  onInternalLinkClick,
}: PDFViewerContainerProps) {
  const pdfContainerRef = useRef<HTMLDivElement>(null);

  // Handle scroll - update current page highlight
  useEffect(() => {
    if (!pdfContainerRef.current || pagesInSelectedPath.length === 0) return;

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
        onCurrentPageChange(closestPage);
      }
    };

    container.addEventListener('scroll', handleScroll, { passive: true });

    return () => {
      container.removeEventListener('scroll', handleScroll);
    };
  }, [pagesInSelectedPath, currentPageNum, pageHeightsRef, onCurrentPageChange]);

  return (
    <div className="flex-1 flex flex-col overflow-hidden py-4 px-16" style={{ backgroundColor, fontFamily: fontStyle }}>
      {/* Title Section */}
      <div className="mb-6">
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
                  onInternalLinkClick={(newPageNum) => {
                    const newPageIndex = pagesInSelectedPath.indexOf(newPageNum);
                    if (newPageIndex !== -1) {
                      onCurrentPageChange(newPageNum);
                      onInternalLinkClick(newPageNum);
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
              onInternalLinkClick={onInternalLinkClick}
              fitToContainer={false}
            />
          </div>
        ) : null}
      </div>
    </div>
  );
}
