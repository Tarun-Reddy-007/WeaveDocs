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

interface HierarchyContextType {
  documentId: string | null;
  pdfUrl: string | null;
  pageAssignments: PageAssignment;
  groupMetadata: GroupMetadata;
  pageTitles: string[];
  setHierarchyData: (data: {
    documentId: string;
    pdfUrl: string;
    pageAssignments: PageAssignment;
    groupMetadata: GroupMetadata;
    pageTitles: string[];
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

  // Initialize from localStorage on mount
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        try {
          const data = JSON.parse(stored);
          setDocumentId(data.documentId);
          setPdfUrl(data.pdfUrl);
          setPageAssignments(data.pageAssignments);
          setGroupMetadata(data.groupMetadata);
          setPageTitles(data.pageTitles);
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
  }) => {
    setDocumentId(data.documentId);
    setPdfUrl(data.pdfUrl);
    setPageAssignments(data.pageAssignments);
    setGroupMetadata(data.groupMetadata);
    setPageTitles(data.pageTitles);

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
