'use client';

import { useState, useRef } from 'react';
import dynamic from 'next/dynamic';
import { Sidebar } from '@/components/layout/sidebar/Sidebar';

const PDFViewer = dynamic(() => import('@/components/PDFViewer').then(mod => mod.PDFViewer), { ssr: false });
const PDFThumbnail = dynamic(() => import('@/components/PDFViewer').then(mod => mod.PDFThumbnail), { ssr: false });

const sidebarItems = [
  {
    label: 'Catalogs',
    href: '/services/product-catalogs',
  },
  {
    label: 'Analytics',
    href: '/services/product-catalogs/analytics',
  },
];

export default function ProductCatalogsPage() {
  const [pdfFile, setPdfFile] = useState<File | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(0);
  const [pdfUrl, setPdfUrl] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleCreateClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file && file.type === 'application/pdf') {
      const url = URL.createObjectURL(file);
      setPdfFile(file);
      setPdfUrl(url);
      setCurrentPage(1);
      setTotalPages(0);
    } else {
      alert('Please select a valid PDF file');
    }
  };

  const handlePreviousPage = () => {
    setCurrentPage(prev => Math.max(prev - 1, 1));
  };

  const handleNextPage = () => {
    setCurrentPage(prev => (prev < totalPages ? prev + 1 : prev));
  };

  return (
    <div className="flex h-screen">
      {/* Sidebar */}
      <Sidebar items={sidebarItems} title="Product Catalogs" />

      {/* Main Content */}
      <main className="flex-1 flex flex-col bg-white overflow-hidden">
        {/* Top Bar */}
        <div className="bg-gray-100 border-b border-gray-300 px-8 py-4 flex justify-between items-center flex-shrink-0">
          <h1 className="text-2xl font-bold text-black">
            {pdfFile ? pdfFile.name : ''}
          </h1>
          <button
            onClick={handleCreateClick}
            className="btn-primary"
          >
            + Create
          </button>
          <input
            ref={fileInputRef}
            type="file"
            accept=".pdf"
            onChange={handleFileSelect}
            className="hidden"
          />
        </div>

        {/* Main Viewer Area */}
        {!pdfFile ? (
          // Empty State - Just blank space
          <div className="flex-1 bg-white"></div>
        ) : (
          // PDF Viewer Layout
          <div className="flex-1 flex overflow-hidden">
            {/* Left Space */}
            <div className="flex-1"></div>

            {/* Center - Page Viewer */}
            <div className="flex-1 flex flex-col bg-white overflow-hidden">
              {/* PDF Display Area */}
              <div className="flex-1 overflow-hidden">
                <PDFViewer
                  pdfUrl={pdfUrl}
                  currentPage={currentPage}
                  onPageChange={setCurrentPage}
                  onTotalPagesChange={setTotalPages}
                />
              </div>

              {/* Navigation Arrows */}
              <div className="flex gap-6 items-center justify-center py-6 px-8 bg-white border-t border-gray-200 flex-shrink-0">
                <button
                  onClick={handlePreviousPage}
                  disabled={currentPage === 1}
                  className={`p-3 rounded-lg transition-colors duration-200 ${
                    currentPage === 1
                      ? 'bg-gray-200 text-gray-400 cursor-not-allowed'
                      : 'bg-black text-white hover:bg-gray-800'
                  }`}
                  aria-label="Previous page"
                >
                  <svg
                    className="w-6 h-6"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M15 19l-7-7 7-7"
                    />
                  </svg>
                </button>

                <span className="text-black font-medium min-w-16 text-center">
                  Page {currentPage} of {totalPages}
                </span>

                <button
                  onClick={handleNextPage}
                  disabled={currentPage >= totalPages}
                  className={`p-3 rounded-lg transition-colors duration-200 ${
                    currentPage >= totalPages
                      ? 'bg-gray-200 text-gray-400 cursor-not-allowed'
                      : 'bg-black text-white hover:bg-gray-800'
                  }`}
                  aria-label="Next page"
                >
                  <svg
                    className="w-6 h-6"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M9 5l7 7-7 7"
                    />
                  </svg>
                </button>
              </div>
            </div>

            {/* Right - Thumbnails Panel */}
            <div className="w-48 bg-gray-100 border-l border-gray-300 overflow-y-auto p-4">
              <div className="space-y-2">
                {Array.from({ length: totalPages }).map((_, index) => {
                  const pageNum = index + 1;
                  const isActive = currentPage === pageNum;
                  return (
                    <PDFThumbnail
                      key={pageNum}
                      pdfUrl={pdfUrl}
                      pageNum={pageNum}
                      isActive={isActive}
                      onClick={() => setCurrentPage(pageNum)}
                    />
                  );
                })}
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
