'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { Document, Page, pdfjs } from 'react-pdf';
import 'react-pdf/dist/Page/AnnotationLayer.css';

if (typeof window !== 'undefined') {
  pdfjs.GlobalWorkerOptions.workerSrc = `https://cdn.jsdelivr.net/npm/pdfjs-dist@${pdfjs.version}/legacy/build/pdf.worker.min.mjs`;
}

// ── PDFViewer ────────────────────────────────────────────────────────────────

interface PDFViewerProps {
  pdfUrl: string | null;
  currentPage: number;
  onTotalPagesChange: (total: number) => void;
  fitToContainer?: boolean;
  onInternalLinkClick?: (pageNumber: number) => void;
}

export function PDFViewer({
  pdfUrl,
  currentPage,
  onTotalPagesChange,
  fitToContainer = false,
  onInternalLinkClick,
}: PDFViewerProps) {
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [containerSize, setContainerSize] = useState({ width: 0, height: 0 });
  const [pageSize, setPageSize] = useState({ width: 0, height: 0 });
  const containerRef = useRef<HTMLDivElement>(null);

  const handleDocumentLoadSuccess = ({ numPages }: { numPages: number }) => {
    onTotalPagesChange(numPages);
    setIsLoading(false);
    setError(null);
  };

  const handleDocumentLoadError = (err: Error | null) => {
    console.error('PDF load error:', err);
    setError(`Failed to load PDF: ${err?.message || 'Unknown error'}`);
    setIsLoading(false);
  };

  // eslint-disable-next-line react-hooks/set-state-in-effect
  useEffect(() => {
    setError(null);
    setIsLoading(Boolean(pdfUrl));
  }, [pdfUrl, currentPage]);

  useEffect(() => {
    const update = () => {
      if (containerRef.current) {
        setContainerSize({
          width: Math.max(containerRef.current.clientWidth, 200),
          height: Math.max(containerRef.current.clientHeight, 200),
        });
      }
    };
    update();
    const ro = new ResizeObserver(update);
    if (containerRef.current) ro.observe(containerRef.current);
    window.addEventListener('resize', update);
    return () => { ro.disconnect(); window.removeEventListener('resize', update); };
  }, []);

  const renderWidth = useMemo(() => {
    if (containerSize.width === 0) return undefined;
    if (!fitToContainer) return containerSize.width;
    if (pageSize.width === 0 || pageSize.height === 0) return containerSize.width;
    const scale = Math.min(
      containerSize.width / pageSize.width,
      containerSize.height / pageSize.height
    );
    return Math.max(Math.floor(pageSize.width * scale), 120);
  }, [containerSize, fitToContainer, pageSize]);

  const handlePageLoadSuccess = (page: {
    width: number; height: number;
    originalWidth?: number; originalHeight?: number;
  }) => {
    setPageSize({
      width: page.originalWidth ?? page.width,
      height: page.originalHeight ?? page.height,
    });
    setIsLoading(false);
  };

  const handleItemClick = (item: { pageNumber?: number }) => {
    if (item.pageNumber && onInternalLinkClick) {
      onInternalLinkClick(item.pageNumber);
      return true;
    }
    return false;
  };

  if (!pdfUrl) return null;

  if (error) {
    return (
      <div className="m-4 border border-black p-4 font-['DM_Sans',sans-serif]">
        <p className="text-[11px] tracking-[0.2em] uppercase font-semibold text-black mb-1">
          Error loading PDF
        </p>
        <p className="text-[11px] text-gray-500">{error}</p>
      </div>
    );
  }

  // Spinner component
  const Spinner = () => (
    <div className="flex items-center gap-3 text-[11px] tracking-[0.2em] uppercase text-gray-400 font-['DM_Sans',sans-serif] m-auto">
      <span className="w-4 h-4 border border-gray-300 border-t-black animate-spin flex-shrink-0" />
      Loading
    </div>
  );

  return (
    <div
      ref={containerRef}
      className={`w-full h-full bg-transparent flex ${
        fitToContainer
          ? 'items-center justify-center overflow-hidden'
          : 'flex-col items-start overflow-y-auto overflow-x-hidden'
      }`}
    >
      {isLoading && <Spinner />}

      {pdfUrl && containerSize.height > 0 && !error && (
        <Document
          key={pdfUrl}
          file={pdfUrl}
          onLoadSuccess={handleDocumentLoadSuccess}
          onLoadError={handleDocumentLoadError}
          onItemClick={onInternalLinkClick ? handleItemClick : undefined}
          loading={<Spinner />}
        >
          {/* Subtle shadow lifts the page off the background */}
          <div className="shadow-[0_2px_16px_0_rgba(0,0,0,0.10)]">
            <Page
              pageNumber={currentPage}
              renderTextLayer={false}
              renderAnnotationLayer={true}
              width={renderWidth}
              onLoadSuccess={handlePageLoadSuccess}
            />
          </div>
        </Document>
      )}
    </div>
  );
}

// ── PDFThumbnail ─────────────────────────────────────────────────────────────

interface PDFThumbnailProps {
  pdfUrl: string | null;
  pageNum: number;
  isActive: boolean;
  title: string;
  onTitleChange: (title: string) => void;
  onClick: () => void;
}

export function PDFThumbnail({
  pdfUrl,
  pageNum,
  isActive,
  title,
  onTitleChange,
  onClick,
}: PDFThumbnailProps) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const [thumbWidth, setThumbWidth] = useState<number>(0);
  const [isEditingTitle, setIsEditingTitle] = useState(false);

  useEffect(() => {
    if (!containerRef.current) return;
    setThumbWidth(containerRef.current.clientWidth);
    const ro = new ResizeObserver(entries => {
      for (const entry of entries) setThumbWidth(Math.floor(entry.contentRect.width));
    });
    ro.observe(containerRef.current);
    return () => ro.disconnect();
  }, []);

  if (!pdfUrl) return null;

  const pageRenderWidth = thumbWidth > 0 ? Math.max(60, thumbWidth) : 120;

  return (
    <div
      onClick={onClick}
      role="button"
      tabIndex={0}
      onKeyDown={e => { if (e.key === 'Enter') onClick(); }}
      className="w-full flex flex-col cursor-pointer font-['DM_Sans',sans-serif] group"
    >
      {/* Title — click to edit */}
      <div className="mb-1.5 px-0.5">
        {isEditingTitle ? (
          <input
            autoFocus
            value={title}
            onChange={e => onTitleChange(e.target.value)}
            onClick={e => e.stopPropagation()}
            onBlur={() => setIsEditingTitle(false)}
            onKeyDown={e => {
              if (e.key === 'Enter' || e.key === 'Escape') {
                e.stopPropagation();
                setIsEditingTitle(false);
              }
            }}
            className="w-full border-b border-black bg-transparent text-[10px] text-black outline-none py-0.5 font-['DM_Sans',sans-serif]"
          />
        ) : (
          <button
            onClick={e => { e.stopPropagation(); setIsEditingTitle(true); }}
            className={`w-full text-left text-[10px] truncate transition-colors ${
              isActive ? 'text-black font-semibold' : 'text-black hover:text-black'
            }`}
          >
            {title}
          </button>
        )}
      </div>

      {/* PDF canvas */}
      <div
        ref={containerRef}
        className={`w-full overflow-hidden flex items-center justify-center transition-all duration-150 ${
          isActive
            ? 'ring-[1.5px] ring-gray-400 shadow-[0_2px_8px_0_rgba(0,0,0,0.12)]'
            : 'ring-[1px] ring-gray-200 group-hover:ring-gray-400'
        }`}
      >
        <Document file={pdfUrl} className="w-full">
          <Page
            pageNumber={pageNum}
            width={pageRenderWidth}
            renderTextLayer={false}
            renderAnnotationLayer={false}
          />
        </Document>
      </div>
    </div>
  );
}