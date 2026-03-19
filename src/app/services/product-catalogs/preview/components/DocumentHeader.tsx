'use client';

import { encodePathSegment } from '../lib/pageUtils';

interface DocumentHeaderProps {
  docName: string | null;
  pdfFileName: string | null;
  documentId: string;
  primaryColor: string;
  fontStyle: string;
  currentPageNum: number;
  selectedPath: string;
  pageTitles: string[];
  pdfUrl: string | null;
  onCopyLink: () => void;
  onDownloadCatalog: () => void;
}

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

export function DocumentHeader({
  docName,
  pdfFileName,
  documentId,
  primaryColor,
  fontStyle,
  currentPageNum,
  selectedPath,
  pageTitles,
  pdfUrl,
  onCopyLink,
  onDownloadCatalog,
}: DocumentHeaderProps) {
  return (
    <div className="px-16 py-4 pt-8">
      <div className="max-w-full mx-auto">
        <div className="flex items-start justify-between gap-4">
          <div className="flex-1">
            <h1 className="text-4xl font-bold" style={{ color: primaryColor, fontFamily: fontStyle }}>
              {docName || (pdfFileName ? pdfFileName.replace(/\.pdf$/i, '') : 'Catalog')}
            </h1>
            <div className="flex items-center justify-between mt-4 gap-4">
              <p className="text-xl" style={{ color: primaryColor, fontFamily: fontStyle }}>{documentId}</p>
              <div className="flex items-center gap-4">
                <button
                  onClick={onCopyLink}
                  className="flex cursor-pointer items-center gap-2 rounded-lg px-3 py-2 text-blue-600 transition-colors hover:underline"
                  title="Share catalog link"
                >
                  {SHARE_ICON}
                  <span className="text-sm font-medium">Share</span>
                </button>
                <button
                  onClick={onDownloadCatalog}
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
  );
}
