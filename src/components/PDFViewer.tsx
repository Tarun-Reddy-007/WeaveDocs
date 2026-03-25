'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { Document, Page, pdfjs } from 'react-pdf';
import 'react-pdf/dist/Page/AnnotationLayer.css';
import 'react-pdf/dist/Page/TextLayer.css';

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
  pageTitle?: string;
  surfaceStyle?: 'card' | 'flat';
}

const pdfDocumentCache = new Map<string, ReturnType<typeof pdfjs.getDocument>['promise']>();
const pdfPageTextCache = new Map<string, Promise<string>>();

type TextItem = {
  str?: string;
  width?: number;
  transform?: number[];
};

function getCachedPdfDocument(pdfUrl: string) {
  const existing = pdfDocumentCache.get(pdfUrl);
  if (existing) return existing;

  const promise = pdfjs.getDocument(pdfUrl).promise;
  pdfDocumentCache.set(pdfUrl, promise);
  return promise;
}

function buildSemanticText(items: TextItem[]) {
  const positioned = items
    .map(item => ({
      text: item.str ?? '',
      x: item.transform?.[4] ?? 0,
      y: item.transform?.[5] ?? 0,
      width: item.width ?? 0,
    }))
    .filter(item => item.text.trim().length > 0)
    .sort((a, b) => {
      if (Math.abs(a.y - b.y) <= 2) return a.x - b.x;
      return b.y - a.y;
    });

  if (positioned.length === 0) return '';

  const lines: Array<Array<(typeof positioned)[number]>> = [];

  positioned.forEach(item => {
    const currentLine = lines[lines.length - 1];
    if (!currentLine) {
      lines.push([item]);
      return;
    }

    const baseline = currentLine[0]?.y ?? item.y;
    if (Math.abs(baseline - item.y) <= 2) {
      currentLine.push(item);
      return;
    }

    lines.push([item]);
  });

  return lines
    .map(line => {
      const sortedLine = [...line].sort((a, b) => a.x - b.x);
      let output = '';
      let previousEndX = 0;
      let previousCharWidth = 4;

      sortedLine.forEach((item, index) => {
        if (index > 0) {
          const gap = item.x - previousEndX;
          if (gap > previousCharWidth * 6) output += '\t';
          else if (gap > previousCharWidth * 1.5 && !output.endsWith(' ')) output += ' ';
        }

        output += item.text;
        previousEndX = item.x + item.width;
        previousCharWidth = item.text.length > 0 ? Math.max(item.width / item.text.length, 3) : previousCharWidth;
      });

      return output.trimEnd();
    })
    .join('\n')
    .replace(/\n{3,}/g, '\n\n')
    .trim();
}

async function extractPageSemanticText(pdfUrl: string, pageNumber: number) {
  const cacheKey = `${pdfUrl}::${pageNumber}`;
  const existing = pdfPageTextCache.get(cacheKey);
  if (existing) return existing;

  const promise = (async () => {
    const pdfDocument = await getCachedPdfDocument(pdfUrl);
    const page = await pdfDocument.getPage(pageNumber);
    const textContent = await page.getTextContent();
    return buildSemanticText((textContent.items ?? []) as TextItem[]);
  })();

  pdfPageTextCache.set(cacheKey, promise);
  return promise;
}

export function PDFViewer({
  pdfUrl,
  currentPage,
  onTotalPagesChange,
  fitToContainer = false,
  onInternalLinkClick,
  pageTitle,
  surfaceStyle = 'card',
}: PDFViewerProps) {
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [containerSize, setContainerSize] = useState({ width: 0, height: 0 });
  const [pageSize, setPageSize] = useState({ width: 0, height: 0 });
  const [semanticText, setSemanticText] = useState('');
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

  useEffect(() => {
    let cancelled = false;

    if (!pdfUrl) {
      setSemanticText('');
      return;
    }

    extractPageSemanticText(pdfUrl, currentPage)
      .then(text => {
        if (!cancelled) setSemanticText(text);
      })
      .catch(err => {
        console.error('PDF text extraction error:', err);
        if (!cancelled) setSemanticText('');
      });

    return () => {
      cancelled = true;
    };
  }, [pdfUrl, currentPage]);

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
      className={`w-full h-full bg-transparent flex select-text ${
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
          <div className={surfaceStyle === 'card' ? 'shadow-[0_2px_16px_0_rgba(0,0,0,0.10)]' : ''}>
            <Page
              pageNumber={currentPage}
              renderTextLayer={true}
              renderAnnotationLayer={true}
              width={renderWidth}
              onLoadSuccess={handlePageLoadSuccess}
              canvasBackground={surfaceStyle === 'flat' ? 'transparent' : '#ffffff'}
            />

            {semanticText && (
              <article
                className="sr-only"
                lang="en"
                data-ai-readable="true"
                data-page-number={currentPage}
                data-page-title={pageTitle || `Page ${currentPage}`}
                aria-label={`Extracted text for ${pageTitle || `Page ${currentPage}`}`}
              >
                <h2>{pageTitle || `Page ${currentPage}`}</h2>
                <div className="whitespace-pre-wrap">{semanticText}</div>
              </article>
            )}
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