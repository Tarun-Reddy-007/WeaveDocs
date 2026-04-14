'use client';

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import type { ParsedHtmlCatalog } from '@/lib/indesign-parser';

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
  fontStyle?: string;
};

export type CatalogSourceType = 'pdf' | 'html';

interface HierarchyContextType {
  sourceType: CatalogSourceType | null;
  documentId: string | null;
  docName: string | null;
  pdfUrl: string | null;
  htmlCatalog: ParsedHtmlCatalog | null;
  pageAssignments: PageAssignment;
  groupMetadata: GroupMetadata;
  pageTitles: string[];
  pdfFileName: string | null;
  sourceFileName: string | null;
  themeColors: ThemeColors | null;
  setHierarchyData: (data: {
    sourceType: CatalogSourceType;
    documentId: string;
    docName?: string;
    pdfUrl?: string | null;
    htmlCatalog?: ParsedHtmlCatalog | null;
    pageAssignments: PageAssignment;
    groupMetadata: GroupMetadata;
    pageTitles: string[];
    pdfFileName?: string;
    sourceFileName?: string | null;
    themeColors?: ThemeColors | null;
  }) => Promise<void>;
}

const HierarchyContext = createContext<HierarchyContextType | undefined>(undefined);

const STORAGE_KEY = 'hierarchy_data';
const DB_NAME = 'secat-hierarchy';
const DB_VERSION = 1;
const STORE_NAME = 'catalogs';
const HTML_CATALOG_KEY = `${STORAGE_KEY}:htmlCatalog`;

type PersistedHierarchyData = {
  sourceType: CatalogSourceType;
  documentId: string;
  docName?: string;
  pdfUrl?: string | null;
  pageAssignments: PageAssignment;
  groupMetadata: GroupMetadata;
  pageTitles: string[];
  pdfFileName?: string | null;
  sourceFileName?: string | null;
  themeColors?: ThemeColors | null;
  updatedAt: number;
};

function openHierarchyDatabase(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onupgradeneeded = () => {
      const database = request.result;
      if (!database.objectStoreNames.contains(STORE_NAME)) {
        database.createObjectStore(STORE_NAME);
      }
    };

    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

async function setIndexedDbValue<T>(key: string, value: T): Promise<void> {
  const database = await openHierarchyDatabase();
  await new Promise<void>((resolve, reject) => {
    const transaction = database.transaction(STORE_NAME, 'readwrite');
    const store = transaction.objectStore(STORE_NAME);
    store.put(value, key);
    transaction.oncomplete = () => resolve();
    transaction.onerror = () => reject(transaction.error);
    transaction.onabort = () => reject(transaction.error);
  });
  database.close();
}

async function getIndexedDbValue<T>(key: string): Promise<T | null> {
  const database = await openHierarchyDatabase();
  const value = await new Promise<T | null>((resolve, reject) => {
    const transaction = database.transaction(STORE_NAME, 'readonly');
    const store = transaction.objectStore(STORE_NAME);
    const request = store.get(key);
    request.onsuccess = () => resolve((request.result as T | undefined) ?? null);
    request.onerror = () => reject(request.error);
  });
  database.close();
  return value;
}

async function deleteIndexedDbValue(key: string): Promise<void> {
  const database = await openHierarchyDatabase();
  await new Promise<void>((resolve, reject) => {
    const transaction = database.transaction(STORE_NAME, 'readwrite');
    const store = transaction.objectStore(STORE_NAME);
    store.delete(key);
    transaction.oncomplete = () => resolve();
    transaction.onerror = () => reject(transaction.error);
    transaction.onabort = () => reject(transaction.error);
  });
  database.close();
}

export function HierarchyProvider({ children }: { children: ReactNode }) {
  const [sourceType, setSourceType] = useState<CatalogSourceType | null>(null);
  const [documentId, setDocumentId] = useState<string | null>(null);
  const [docName, setDocName] = useState<string | null>(null);
  const [pdfUrl, setPdfUrl] = useState<string | null>(null);
  const [htmlCatalog, setHtmlCatalog] = useState<ParsedHtmlCatalog | null>(null);
  const [pageAssignments, setPageAssignments] = useState<PageAssignment>({});
  const [groupMetadata, setGroupMetadata] = useState<GroupMetadata>({});
  const [pageTitles, setPageTitles] = useState<string[]>([]);
  const [pdfFileName, setPdfFileName] = useState<string | null>(null);
  const [sourceFileName, setSourceFileName] = useState<string | null>(null);
  const [themeColors, setThemeColors] = useState<ThemeColors | null>(null);

  const applyHierarchyData = (data: {
    sourceType?: CatalogSourceType | null;
    documentId?: string | null;
    docName?: string | null;
    pdfUrl?: string | null;
    htmlCatalog?: ParsedHtmlCatalog | null;
    pageAssignments?: PageAssignment;
    groupMetadata?: GroupMetadata;
    pageTitles?: string[];
    pdfFileName?: string | null;
    sourceFileName?: string | null;
    themeColors?: ThemeColors | null;
  }) => {
    setSourceType(data.sourceType || null);
    setDocumentId(data.documentId || null);
    setDocName(data.docName || null);
    setPdfUrl(data.pdfUrl || null);
    setHtmlCatalog(data.htmlCatalog || null);
    setPageAssignments(data.pageAssignments || {});
    setGroupMetadata(data.groupMetadata || {});
    setPageTitles(data.pageTitles || []);
    setPdfFileName(data.pdfFileName || null);
    setSourceFileName(data.sourceFileName || data.pdfFileName || null);
    setThemeColors(data.themeColors || null);
  };

  const loadPersistedHierarchyData = async (serialized?: string | null) => {
    if (typeof window === 'undefined') return;
    const stored = serialized ?? localStorage.getItem(STORAGE_KEY);
    if (!stored) return;

    try {
      const data = JSON.parse(stored) as PersistedHierarchyData;
      const htmlCatalog = data.sourceType === 'html'
        ? await getIndexedDbValue<ParsedHtmlCatalog>(HTML_CATALOG_KEY)
        : null;

      applyHierarchyData({
        ...data,
        htmlCatalog,
      });
    } catch (e) {
      console.error('Failed to load hierarchy data from storage', e);
    }
  };

  // Initialize from localStorage on mount
  useEffect(() => {
    void loadPersistedHierarchyData();
  }, []);

  useEffect(() => {
    if (typeof window === 'undefined') return;

    const handleStorage = (event: StorageEvent) => {
      if (event.key !== STORAGE_KEY || !event.newValue) return;
      void loadPersistedHierarchyData(event.newValue);
    };

    window.addEventListener('storage', handleStorage);
    return () => window.removeEventListener('storage', handleStorage);
  }, []);

  const setHierarchyData = async (data: {
    sourceType: CatalogSourceType;
    documentId: string;
    docName?: string;
    pdfUrl?: string | null;
    htmlCatalog?: ParsedHtmlCatalog | null;
    pageAssignments: PageAssignment;
    groupMetadata: GroupMetadata;
    pageTitles: string[];
    pdfFileName?: string;
    sourceFileName?: string | null;
    themeColors?: ThemeColors | null;
  }) => {
    applyHierarchyData(data);

    // Persist to localStorage
    if (typeof window !== 'undefined') {
      try {
        if (data.sourceType === 'html' && data.htmlCatalog) {
          await setIndexedDbValue(HTML_CATALOG_KEY, data.htmlCatalog);
        } else {
          await deleteIndexedDbValue(HTML_CATALOG_KEY);
        }

        const persistedData: PersistedHierarchyData = {
          sourceType: data.sourceType,
          documentId: data.documentId,
          docName: data.docName,
          pdfUrl: data.pdfUrl || null,
          pageAssignments: data.pageAssignments,
          groupMetadata: data.groupMetadata,
          pageTitles: data.pageTitles,
          pdfFileName: data.pdfFileName || null,
          sourceFileName: data.sourceFileName || data.pdfFileName || null,
          themeColors: data.themeColors || null,
          updatedAt: Date.now(),
        };

        localStorage.setItem(STORAGE_KEY, JSON.stringify(persistedData));
      } catch (e) {
        console.error('Failed to save hierarchy data to storage', e);
        throw e;
      }
    }
  };

  return (
    <HierarchyContext.Provider
      value={{
        sourceType,
        documentId,
        docName,
        pdfUrl,
        htmlCatalog,
        pageAssignments,
        groupMetadata,
        pageTitles,
        pdfFileName,
        sourceFileName,
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
