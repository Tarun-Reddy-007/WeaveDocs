'use client';

import { useState, useEffect, useRef } from 'react';
import { Document, Page, pdfjs } from 'react-pdf';

// Set worker source from jsdelivr CDN
if (typeof window !== 'undefined') {
  pdfjs.GlobalWorkerOptions.workerSrc = `https://cdn.jsdelivr.net/npm/pdfjs-dist@${pdfjs.version}/legacy/build/pdf.worker.min.mjs`;
}

interface PDFViewerProps {
  pdfUrl: string | null;
  currentPage: number;
  onPageChange: (page: number) => void;
  onTotalPagesChange: (total: number) => void;
}

export function PDFViewer({ pdfUrl, currentPage, onPageChange: _onPageChange, onTotalPagesChange }: PDFViewerProps) {
  const [error, setError] = useState<{ url: string; message: string } | null>(null);
  const [pageWidth, setPageWidth] = useState(800);
  const containerRef = useRef<HTMLDivElement>(null);

  const handleDocumentLoadSuccess = ({ numPages }: { numPages: number }) => {
    onTotalPagesChange(numPages);
    setError(null);
  };

  const handleDocumentLoadError = (err: unknown) => {
    console.error('PDF load error:', err);
    const message = err instanceof Error ? err.message : 'Unknown error';
    setError({ url: pdfUrl ?? '', message: `Failed to load PDF: ${message}` });
  };

  useEffect(() => {
    const updateWidth = () => {
      if (containerRef.current) {
        // Set width to container width minus padding
        const width = containerRef.current.clientWidth - 20;
        setPageWidth(Math.max(width, 400));
      }
    };

    updateWidth();
    window.addEventListener('resize', updateWidth);
    return () => window.removeEventListener('resize', updateWidth);
  }, []);

  if (!pdfUrl) {
    return null;
  }

  if (error && error.url === pdfUrl) {
    return (
      <div className="bg-red-50 border border-red-300 rounded-lg p-4 text-red-700">
        <p className="font-semibold">Error loading PDF</p>
        <p className="text-sm">{error.message}</p>
      </div>
    );
  }

  return (
    <div ref={containerRef} className="w-full h-full bg-gray-50 overflow-auto flex items-center justify-center p-2">
      {pdfUrl && (
        <Document
          key={pdfUrl}
          file={pdfUrl}
          onLoadSuccess={handleDocumentLoadSuccess}
          onLoadError={handleDocumentLoadError}
          loading={<p className="text-center text-gray-500">Loading PDF...</p>}
        >
          <Page
            pageNumber={currentPage}
            renderTextLayer={true}
            renderAnnotationLayer={true}
            width={pageWidth}
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
  onClick: () => void;
}

export function PDFThumbnail({ pdfUrl, pageNum, isActive, onClick }: PDFThumbnailProps) {
  if (!pdfUrl) {
    return null;
  }

  return (
    <button
      onClick={onClick}
      className={`w-full p-2 rounded-lg transition-colors duration-200 text-center text-sm font-medium ${
        isActive
          ? 'bg-black text-white'
          : 'bg-white text-black border border-gray-300 hover:bg-gray-50'
      }`}
    >
      <div className="bg-gray-200 rounded h-20 mb-2 flex items-center justify-center overflow-hidden">
        <Document file={pdfUrl} className="w-full h-full">
          <Page
            pageNumber={pageNum}
            width={160}
            renderTextLayer={false}
            renderAnnotationLayer={false}
          />
        </Document>
      </div>
      <span className="text-xs">{pageNum}</span>
    </button>
  );
}
