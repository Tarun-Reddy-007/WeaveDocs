'use client';

import { useEffect, useRef, useState } from 'react';
import { Document, Page, pdfjs } from 'react-pdf';

// Set worker source from jsdelivr CDN
if (typeof window !== 'undefined') {
  pdfjs.GlobalWorkerOptions.workerSrc = `https://cdn.jsdelivr.net/npm/pdfjs-dist@${pdfjs.version}/legacy/build/pdf.worker.min.mjs`;
}

interface PDFViewerProps {
  pdfUrl: string | null;
  currentPage: number;
  onTotalPagesChange: (total: number) => void;
}

export function PDFViewer({ pdfUrl, currentPage, onTotalPagesChange }: PDFViewerProps) {
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [pageHeight, setPageHeight] = useState(0);
  const containerRef = useRef<HTMLDivElement>(null);

  const handleDocumentLoadSuccess = ({ numPages }: { numPages: number }) => {
    onTotalPagesChange(numPages);
    setIsLoading(false);
    setError(null);
  };

  const handleDocumentLoadError = (error: any) => {
    console.error('PDF load error:', error);
    setError(`Failed to load PDF: ${error?.message || 'Unknown error'}`);
    setIsLoading(false);
  };

  useEffect(() => {
    if (pdfUrl) {
      setIsLoading(true);
      setError(null);
    }
  }, [pdfUrl]);

  useEffect(() => {
    const updateHeight = () => {
      if (containerRef.current) {
        const height = containerRef.current.clientHeight - 32;
        setPageHeight(Math.max(height, 200));
      }
    };

    updateHeight();
    window.addEventListener('resize', updateHeight);
    return () => window.removeEventListener('resize', updateHeight);
  }, []);

  if (!pdfUrl) {
    return null;
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-300 rounded-lg p-4 text-red-700">
        <p className="font-semibold">Error loading PDF</p>
        <p className="text-sm">{error}</p>
      </div>
    );
  }

  return (
    <div ref={containerRef} className="w-full h-full bg-gray-50 overflow-hidden flex items-center justify-center p-4">
      {isLoading && <p className="text-center text-gray-500">Loading PDF...</p>}
      {pdfUrl && pageHeight > 0 && (
        <Document
          key={pdfUrl}
          file={pdfUrl}
          onLoadSuccess={handleDocumentLoadSuccess}
          onLoadError={handleDocumentLoadError}
          loading={<p className="text-center text-gray-500">Loading PDF...</p>}
        >
          <Page
            pageNumber={currentPage}
            renderTextLayer={false}
            renderAnnotationLayer={false}
            height={pageHeight}
          />
        </Document>
      )}
    </div>
  );
}

interface PDFThumbnailProps {
  pdfUrl: string | null;
  pageNum: number;
  isActive: boolean;
  title: string;
  onTitleChange: (title: string) => void;
  onClick: () => void;
}

export function PDFThumbnail({ pdfUrl, pageNum, isActive, title, onTitleChange, onClick }: PDFThumbnailProps) {
  if (!pdfUrl) {
    return null;
  }
  const containerRef = useRef<HTMLDivElement | null>(null);
  const [thumbWidth, setThumbWidth] = useState<number>(0);

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    setThumbWidth(el.clientWidth);
    const ro = new ResizeObserver((entries) => {
      for (const entry of entries) {
        setThumbWidth(Math.floor(entry.contentRect.width));
      }
    });
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  // Compute a width for the Page canvas that fits exactly inside the thumbnail container
  const pageRenderWidth = thumbWidth > 0 ? Math.max(60, thumbWidth) : 120;

  return (
    <div
      onClick={onClick}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => { if (e.key === 'Enter') onClick(); }}
      className={`w-full rounded-lg transition-colors duration-200 ${
        isActive
          ? 'bg-black text-white'
          : 'bg-white text-black border border-gray-300 hover:bg-gray-50'
      } p-1 flex flex-col cursor-pointer`}
    >
      <div className="w-full mb-1">
        <input
          value={title}
          onChange={(e) => onTitleChange(e.target.value)}
          onClick={(e) => e.stopPropagation()}
          className={`w-full text-sm px-2 py-1 border border-gray-300 rounded ${
            isActive ? 'bg-gray-800 text-white' : 'bg-white text-black'
          }`}
        />
      </div>

      <div ref={containerRef} className="bg-gray-200 rounded flex-1 min-h-20 flex items-center justify-center overflow-hidden mb-1">
        <Document file={pdfUrl} className="w-full h-full">
          <Page
            pageNumber={pageNum}
            width={pageRenderWidth}
            renderTextLayer={false}
            renderAnnotationLayer={false}
          />
        </Document>
      </div>

      <div className="w-full flex items-center justify-center py-1" style={{ borderTopColor: isActive ? 'rgba(255,255,255,0.18)' : '#e5e7eb', borderTopWidth: '1px' }}>
        <span className="bg-black text-white text-xs font-medium w-5 h-5 rounded-full flex items-center justify-center">{pageNum}</span>
      </div>
    </div>
  );
}
