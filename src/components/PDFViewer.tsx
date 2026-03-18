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

export function PDFViewer({ pdfUrl, currentPage, onPageChange, onTotalPagesChange }: PDFViewerProps) {
  const [totalPages, setTotalPages] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [pageWidth, setPageWidth] = useState(800);
  const containerRef = useRef<HTMLDivElement>(null);

  const handleDocumentLoadSuccess = ({ numPages }: { numPages: number }) => {
    setTotalPages(numPages);
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

  if (error) {
    return (
      <div className="bg-red-50 border border-red-300 rounded-lg p-4 text-red-700">
        <p className="font-semibold">Error loading PDF</p>
        <p className="text-sm">{error}</p>
      </div>
    );
  }

  return (
    <div ref={containerRef} className="w-full h-full bg-gray-50 overflow-auto flex items-center justify-center p-2">
      {isLoading && <p className="text-center text-gray-500">Loading PDF...</p>}
      {pdfUrl && (
        <Document
          file={pdfUrl}
          onLoadSuccess={handleDocumentLoadSuccess}
          onLoadError={handleDocumentLoadError}
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
