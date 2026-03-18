'use client';

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';

export type PageAssignment = {
  [pageNum: number]: string;
};

export type GroupMetadata = {
  [path: string]: {
    title: string;
  };
};

export type ThemeColors = {
  primaryColor: string;
  componentColor: string;
  backgroundColor: string;
};

interface HierarchyContextType {
  documentId: string | null;
  pdfUrl: string | null;
  pageAssignments: PageAssignment;
  groupMetadata: GroupMetadata;
  pageTitles: string[];
  pdfFileName: string | null;
  themeColors: ThemeColors | null;
  setHierarchyData: (data: {
    documentId: string;
    pdfUrl: string;
    pageAssignments: PageAssignment;
    groupMetadata: GroupMetadata;
    pageTitles: string[];
    pdfFileName?: string;
    themeColors?: ThemeColors | null;
  }) => void;
}

const HierarchyContext = createContext<HierarchyContextType | undefined>(undefined);

const STORAGE_KEY = 'hierarchy_data';

export function HierarchyProvider({ children }: { children: ReactNode }) {
  const [documentId, setDocumentId] = useState<string | null>(null);
  const [pdfUrl, setPdfUrl] = useState<string | null>(null);
  const [pageAssignments, setPageAssignments] = useState<PageAssignment>({});
  const [groupMetadata, setGroupMetadata] = useState<GroupMetadata>({});
  const [pageTitles, setPageTitles] = useState<string[]>([]);
  const [pdfFileName, setPdfFileName] = useState<string | null>(null);
  const [themeColors, setThemeColors] = useState<ThemeColors | null>(null);

  // Initialize from localStorage on mount
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        try {
          const data = JSON.parse(stored);
          // Batch state updates
          setDocumentId(data.documentId);
          setPdfUrl(data.pdfUrl);
          setPageAssignments(data.pageAssignments);
          setGroupMetadata(data.groupMetadata);
          setPageTitles(data.pageTitles);
          setPdfFileName(data.pdfFileName || null);
          setThemeColors(data.themeColors || null);
        } catch (e) {
          console.error('Failed to load hierarchy data from storage', e);
        }
      }
    }
  }, []);

  const setHierarchyData = (data: {
    documentId: string;
    pdfUrl: string;
    pageAssignments: PageAssignment;
    groupMetadata: GroupMetadata;
    pageTitles: string[];
    pdfFileName?: string;
    themeColors?: ThemeColors | null;
  }) => {
    setDocumentId(data.documentId);
    setPdfUrl(data.pdfUrl);
    setPageAssignments(data.pageAssignments);
    setGroupMetadata(data.groupMetadata);
    setPageTitles(data.pageTitles);
    setPdfFileName(data.pdfFileName || null);
    setThemeColors(data.themeColors || null);

    // Persist to localStorage
    if (typeof window !== 'undefined') {
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
      } catch (e) {
        console.error('Failed to save hierarchy data to storage', e);
      }
    }
  };

  return (
    <HierarchyContext.Provider
      value={{
        documentId,
        pdfUrl,
        pageAssignments,
        groupMetadata,
        pageTitles,
        pdfFileName,
        themeColors,
        setHierarchyData,
      }}
    >
      {children}
    </HierarchyContext.Provider>
  );
}

export function useHierarchy() {
  const context = useContext(HierarchyContext);
  if (!context) {
    throw new Error('useHierarchy must be used within HierarchyProvider');
  }
  return context;
}
