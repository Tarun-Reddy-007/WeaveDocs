'use client';

import { useState, useRef } from 'react';
import dynamic from 'next/dynamic';
import { Sidebar } from '@/components/layout/sidebar/Sidebar';
import { useHierarchy } from '@/lib/HierarchyContext';

type PageAssignment = { [pageNum: number]: string };
type GroupMetadata = { [path: string]: { title: string } };

const PDFViewer = dynamic(() => import('@/components/PDFViewer').then(mod => mod.PDFViewer), { ssr: false });
const PDFThumbnail = dynamic(() => import('@/components/PDFViewer').then(mod => mod.PDFThumbnail), { ssr: false });

const sidebarItems = [
  { label: 'Catalogs', href: '/services/product-catalogs' },
  { label: 'Analytics', href: '/services/product-catalogs/analytics' },
];

const getPagesInPath = (path: string, assignments: PageAssignment): number[] =>
  Object.entries(assignments)
    .filter(([, p]) => p === path)
    .map(([n]) => parseInt(n, 10))
    .sort((a, b) => a - b);

const getChildPaths = (parentPath: string, metadata: GroupMetadata): string[] => {
  const prefix = parentPath === 'root' ? '' : `${parentPath}/`;
  const children = new Set<string>();
  Object.keys(metadata).forEach(path => {
    if (path === 'root') return;
    if (prefix === '' && !path.includes('/')) children.add(path);
    else if (prefix && path.startsWith(prefix) && !path.slice(prefix.length).includes('/')) children.add(path);
  });
  return Array.from(children).sort();
};

// ── SVG Icons ────────────────────────────────────────────────────────────────
const IconMoveDown = () => (
  <svg viewBox="0 0 12 12" className="w-3 h-3" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
    <path d="M6 1v8M3 6l3 3 3-3" />
  </svg>
);
const IconPlus = () => (
  <svg viewBox="0 0 12 12" className="w-3 h-3" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round">
    <path d="M6 2v8M2 6h8" />
  </svg>
);
const IconX = () => (
  <svg viewBox="0 0 12 12" className="w-3 h-3" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round">
    <path d="M2 2l8 8M10 2L2 10" />
  </svg>
);
const IconChevron = ({ open }: { open: boolean }) => (
  <svg viewBox="0 0 10 10" className={`w-2.5 h-2.5 transition-transform duration-150 ${open ? 'rotate-90' : ''}`} fill="currentColor">
    <path d="M3 1.5l4 3.5-4 3.5V1.5z" />
  </svg>
);
const IconFolder = ({ empty }: { empty?: boolean }) => (
  <svg viewBox="0 0 14 14" className={`w-3.5 h-3.5 flex-shrink-0 ${empty ? 'text-red-300' : 'text-gray-500'}`} fill="currentColor">
    <path d="M1 3.5A1 1 0 012 2.5h3.5L7 4.5h5a1 1 0 011 1v5a1 1 0 01-1 1H2a1 1 0 01-1-1v-6z" />
  </svg>
);
const IconPage = () => (
  <svg viewBox="0 0 12 14" className="w-3 h-3.5 flex-shrink-0 text-gray-400" fill="none" stroke="currentColor" strokeWidth="1.2">
    <path d="M2 1h6l2 2v10H2V1z" strokeLinejoin="round" />
    <path d="M7 1v3h3" strokeLinejoin="round" />
    <path d="M4 6h4M4 8h4M4 10h2" strokeLinecap="round" />
  </svg>
);
const IconEye = () => (
  <svg viewBox="0 0 14 14" className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth="1.4">
    <path d="M1 7s2-4 6-4 6 4 6 4-2 4-6 4-6-4-6-4z" />
    <circle cx="7" cy="7" r="1.5" />
  </svg>
);
const IconPublish = () => (
  <svg viewBox="0 0 14 14" className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round">
    <path d="M7 9V2M4 5l3-3 3 3" />
    <path d="M2 11h10" />
  </svg>
);
// ─────────────────────────────────────────────────────────────────────────────

const FONT_OPTIONS = [
  'Arial', 'Arial Rounded MT Bold', 'Comic Sans MS', 'Courier New',
  'Garamond', 'Georgia', 'Impact', 'Lucida Console',
  'Palatino Linotype', 'Segoe UI', 'Tahoma', 'Times New Roman',
  'Trebuchet MS', 'Verdana',
];

export default function ProductCatalogsPage() {
  const { setHierarchyData } = useHierarchy();

  const [pdfFile, setPdfFile] = useState<File | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(0);
  const [pdfUrl, setPdfUrl] = useState<string | null>(null);
  const [pageTitles, setPageTitles] = useState<string[]>([]);
  const [pageAssignments, setPageAssignments] = useState<PageAssignment>({});
  const [groupMetadata, setGroupMetadata] = useState<GroupMetadata>({ root: { title: 'All Pages' } });
  const [expandedPaths, setExpandedPaths] = useState<Set<string>>(new Set(['root']));
  const [selectedPages, setSelectedPages] = useState<Set<number>>(new Set());
  const [selectionError, setSelectionError] = useState<string | null>(null);
  const [editingPath, setEditingPath] = useState<string | null>(null);
  const [tempTitle, setTempTitle] = useState('');
  const [hierarchyReady, setHierarchyReady] = useState(false);
  const [documentId, setDocumentId] = useState('');
  const [docName, setDocName] = useState('');
  const [fontStyle, setFontStyle] = useState('Arial');
  const [themeInputs, setThemeInputs] = useState({ primaryColor: '', componentColor: '', backgroundColor: '' });
  const [themeErrors, setThemeErrors] = useState<Record<string, string>>({});
  const fileInputRef = useRef<HTMLInputElement>(null);

  const isValidHex = (v: string) => /^#([0-9A-Fa-f]{6})$/.test(v.trim());
  const hasAllThemeColors =
    isValidHex(themeInputs.primaryColor) &&
    isValidHex(themeInputs.componentColor) &&
    isValidHex(themeInputs.backgroundColor);
  const canPublish = documentId.length > 6 && hasAllThemeColors;

  const persistHierarchyData = () => {
    setHierarchyData({
      documentId, docName, pdfUrl: pdfUrl || '',
      pageAssignments, groupMetadata, pageTitles,
      pdfFileName: pdfFile?.name,
      themeColors: hasAllThemeColors
        ? { primaryColor: themeInputs.primaryColor.trim(), componentColor: themeInputs.componentColor.trim(), backgroundColor: themeInputs.backgroundColor.trim(), fontStyle }
        : null,
    });
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file && file.type === 'application/pdf') {
      if (pdfUrl) URL.revokeObjectURL(pdfUrl);
      const url = URL.createObjectURL(file);
      setPdfFile(file); setPdfUrl(url); setCurrentPage(1); setTotalPages(0);
      setPageTitles([]); setPageAssignments({}); setGroupMetadata({});
      setExpandedPaths(new Set()); setEditingPath(null);
      setSelectedPages(new Set()); setSelectionError(null);
      setHierarchyReady(false); setDocumentId(''); setDocName(''); setFontStyle('Arial');
      setThemeInputs({ primaryColor: '', componentColor: '', backgroundColor: '' });
      setThemeErrors({});
    } else alert('Please select a valid PDF file');
  };

  const handleTotalPagesLoaded = (total: number) => {
    setTotalPages(total);
    if (!hierarchyReady) {
      setPageTitles(Array.from({ length: total }, (_, i) => `Title ${i + 1}`));
      const init: PageAssignment = {};
      for (let i = 1; i <= total; i++) init[i] = 'root';
      setPageAssignments(init);
      setGroupMetadata({ root: { title: 'All Pages' } });
      setExpandedPaths(new Set(['root']));
      setSelectedPages(new Set()); setSelectionError(null);
      setHierarchyReady(true);
    }
  };

  const handlePageTitleChange = (pageNum: number, value: string) =>
    setPageTitles(prev => prev.map((t, i) => i === pageNum - 1 ? value : t));

  const createNewGroup = (parentPath: string) => {
    const title = `Group ${Object.keys(groupMetadata).filter(p => p !== 'root').length + 1}`;
    const newPath = parentPath === 'root' ? title : `${parentPath}/${title}`;
    setGroupMetadata(prev => ({ ...prev, [newPath]: { title } }));
    setExpandedPaths(prev => new Set([...prev, newPath]));
  };

  const renameGroup = (path: string, newTitle: string) => {
    if (path === 'root') return;
    const parentPath = path.substring(0, path.lastIndexOf('/')) || 'root';
    const newPath = parentPath === 'root' ? newTitle : `${parentPath}/${newTitle}`;
    setGroupMetadata(prev => { const u = { ...prev }; const m = u[path]; delete u[path]; u[newPath] = { ...m, title: newTitle }; return u; });
    setPageAssignments(prev => { const u = { ...prev }; Object.entries(prev).forEach(([n, p]) => { if (p === path) u[parseInt(n)] = newPath; }); return u; });
    setExpandedPaths(prev => { const u = new Set(prev); if (u.has(path)) { u.delete(path); u.add(newPath); } return u; });
  };

  const deleteGroup = (path: string) => {
    if (path === 'root') return;
    const parentPath = path.substring(0, path.lastIndexOf('/')) || 'root';
    setPageAssignments(prev => { const u = { ...prev }; Object.entries(prev).forEach(([n, p]) => { if (p === path || p.startsWith(path + '/')) u[parseInt(n)] = parentPath; }); return u; });
    setGroupMetadata(prev => { const u = { ...prev }; delete u[path]; Object.keys(u).filter(k => k.startsWith(path + '/')).forEach(k => delete u[k]); return u; });
    setExpandedPaths(prev => { const u = new Set(prev); u.delete(path); Array.from(u).filter(p => p.startsWith(path + '/')).forEach(p => u.delete(p)); return u; });
  };

  const areConsecutive = (nums: number[]) => {
    const s = [...nums].sort((a, b) => a - b);
    return s.every((n, i) => i === 0 || n === s[i - 1] + 1);
  };

  const getMinPageInPath = (path: string, assignments: PageAssignment, metadata: GroupMetadata): number => {
    const direct = getPagesInPath(path, assignments);
    if (direct.length > 0) return Math.min(...direct);
    const mins = getChildPaths(path, metadata).map(cp => getMinPageInPath(cp, assignments, metadata)).filter(isFinite);
    return mins.length > 0 ? Math.min(...mins) : Infinity;
  };

  const getOrderedItems = (parentPath: string, assignments: PageAssignment, metadata: GroupMetadata) => {
    const items: Array<{ type: 'page' | 'group'; pageNum?: number; path?: string; minPage?: number; isEmpty?: boolean }> = [];
    getPagesInPath(parentPath, assignments).forEach(n => items.push({ type: 'page', pageNum: n, minPage: n }));
    getChildPaths(parentPath, metadata).forEach(cp => {
      const minPage = getMinPageInPath(cp, assignments, metadata);
      items.push({ type: 'group', path: cp, minPage, isEmpty: minPage === Infinity });
    });
    items.sort((a, b) => {
      if (a.isEmpty && !b.isEmpty) return -1;
      if (!a.isEmpty && b.isEmpty) return 1;
      return (a.minPage ?? Infinity) - (b.minPage ?? Infinity);
    });
    return items;
  };

  const getFlattenedPageSequence = (parentPath: string, assignments: PageAssignment, metadata: GroupMetadata): number[] =>
    getOrderedItems(parentPath, assignments, metadata).flatMap(item =>
      item.type === 'page' ? (item.pageNum ? [item.pageNum] : [])
        : (item.path ? getFlattenedPageSequence(item.path, assignments, metadata) : [])
    );

  const moveSelectedPages = (targetPath: string) => {
    if (selectedPages.size === 0) { setSelectionError('No pages selected.'); return; }
    const nums = Array.from(selectedPages).map(Number).sort((a, b) => a - b);
    if (!areConsecutive(nums)) { setSelectionError('Select only consecutive pages.'); return; }
    const sourceGroups = new Set(nums.map(n => pageAssignments[n] || 'root'));
    if (sourceGroups.size > 1) { setSelectionError('All selected pages must be from the same group.'); return; }
    if (Array.from(sourceGroups)[0] === targetPath) { setSelectionError('Already in this group.'); return; }
    const next: PageAssignment = { ...pageAssignments };
    nums.forEach(n => { next[n] = targetPath; });
    const seq = getFlattenedPageSequence('root', next, groupMetadata);
    if (seq.length !== totalPages || !seq.every((n, i) => n === i + 1)) { setSelectionError('Cannot move — would break the page sequence.'); return; }
    setPageAssignments(next);
    setSelectedPages(new Set()); setSelectionError(null);
  };

  const handleThemeInputChange = (key: 'primaryColor' | 'componentColor' | 'backgroundColor', value: string) => {
    setThemeInputs(prev => ({ ...prev, [key]: value }));
    if (!value.trim()) { setThemeErrors(prev => ({ ...prev, [key]: 'Required' })); return; }
    if (!isValidHex(value)) { setThemeErrors(prev => ({ ...prev, [key]: 'Use #RRGGBB' })); return; }
    setThemeErrors(prev => { const n = { ...prev }; delete n[key]; return n; });
  };

  const renderHierarchy = (parentPath = 'root', depth = 0): React.ReactNode => {
    const items = getOrderedItems(parentPath, pageAssignments, groupMetadata);
    return (
      <div>
        {items.map(item => {
          if (item.type === 'page') {
            const pageNum = item.pageNum!;
            const title = pageTitles[pageNum - 1] ?? `Title ${pageNum}`;
            const isSelected = selectedPages.has(pageNum);
            const isEditing = editingPath === `page-${pageNum}`;
            return (
              <div
                key={`page-${pageNum}`}
                style={{ paddingLeft: `${depth * 12 + 10}px` }}
                className={`group flex items-center gap-2 py-[6px] pr-3 border-b border-gray-100 transition-colors duration-100 ${isSelected ? 'bg-gray-100' : 'hover:bg-gray-50'}`}
              >
                <div className="relative flex-shrink-0">
                  <input type="checkbox" checked={isSelected} id={`chk-${pageNum}`}
                    onChange={e => {
                      if (e.target.checked) {
                        const next = new Set([...selectedPages, pageNum]);
                        if (!areConsecutive(Array.from(next).sort((a, b) => a - b))) { setSelectionError('Select only consecutive pages.'); return; }
                        setSelectedPages(next); setSelectionError(null);
                      } else {
                        setSelectedPages(prev => { const n = new Set(prev); n.delete(pageNum); return n; });
                        setSelectionError(null);
                      }
                    }}
                    className="peer sr-only"
                  />
                  <label htmlFor={`chk-${pageNum}`}
                    className="w-3.5 h-3.5 border border-gray-300 peer-checked:border-black peer-checked:bg-black flex items-center justify-center cursor-pointer transition-all duration-100 block flex-shrink-0"
                  >
                    {isSelected && (
                      <svg viewBox="0 0 10 10" className="w-2 h-2 text-white" fill="none">
                        <path d="M1.5 5l2.5 2.5 4.5-4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                      </svg>
                    )}
                  </label>
                </div>
                <IconPage />
                <span className="text-[10px] font-mono text-gray-400 flex-shrink-0 w-4 text-center">{pageNum}</span>
                {isEditing ? (
                  <input autoFocus value={tempTitle}
                    onChange={e => setTempTitle(e.target.value)}
                    onBlur={() => { if (tempTitle.trim()) handlePageTitleChange(pageNum, tempTitle); setEditingPath(null); }}
                    onKeyDown={e => { if (e.key === 'Enter') { if (tempTitle.trim()) handlePageTitleChange(pageNum, tempTitle); setEditingPath(null); } if (e.key === 'Escape') setEditingPath(null); }}
                    className="flex-1 border-b border-black bg-transparent text-[11px] text-black outline-none py-0.5"
                  />
                ) : (
                  <button onClick={() => { setEditingPath(`page-${pageNum}`); setTempTitle(title); }}
                    className="flex-1 text-left text-[11px] text-black hover:text-black truncate font-medium"
                  >{title}</button>
                )}
              </div>
            );
          }

          const path = item.path!;
          const groupTitle = groupMetadata[path]?.title ?? 'Unnamed';
          const childPages = getPagesInPath(path, pageAssignments);
          const subGroups = getChildPaths(path, groupMetadata);
          const hasChildren = subGroups.length > 0 || childPages.length > 0;
          const isExpanded = expandedPaths.has(path);
          const isEmpty = item.isEmpty;
          const isEditing = editingPath === path;

          return (
            <div key={path}>
              <div
                style={{ paddingLeft: `${depth * 12 + 6}px` }}
                className={`group flex items-center gap-1.5 py-[6px] pr-2 border-b transition-colors duration-100 ${isEmpty ? 'border-red-100 bg-red-50/30' : 'border-gray-100 hover:bg-gray-50'}`}
              >
                <button
                  onClick={() => setExpandedPaths(prev => { const n = new Set(prev); n.has(path) ? n.delete(path) : n.add(path); return n; })}
                  className="flex-shrink-0 w-4 h-4 flex items-center justify-center text-gray-400 hover:text-black transition-colors"
                >
                  {hasChildren ? <IconChevron open={isExpanded} /> : <span className="w-2.5" />}
                </button>
                <IconFolder empty={isEmpty} />
                {isEditing ? (
                  <input autoFocus value={tempTitle}
                    onChange={e => setTempTitle(e.target.value)}
                    onBlur={() => { if (tempTitle.trim()) renameGroup(path, tempTitle); setEditingPath(null); }}
                    onKeyDown={e => { if (e.key === 'Enter') { if (tempTitle.trim()) renameGroup(path, tempTitle); setEditingPath(null); } if (e.key === 'Escape') setEditingPath(null); }}
                    className="flex-1 border-b border-black bg-transparent text-[11px] font-semibold text-black outline-none py-0.5"
                  />
                ) : (
                  <button onClick={() => { setEditingPath(path); setTempTitle(groupTitle); }}
                    className="flex-1 text-left text-[11px] font-semibold text-black truncate"
                  >
                    {groupTitle}
                    {isEmpty && <span className="ml-1.5 text-[10px] font-normal text-red-400">empty</span>}
                  </button>
                )}
                <div className="opacity-0 group-hover:opacity-100 flex items-center gap-0.5 flex-shrink-0 transition-opacity duration-150">
                  <button onClick={() => moveSelectedPages(path)} disabled={selectedPages.size === 0} title="Move selected pages here"
                    className="w-6 h-6 flex items-center justify-center rounded text-gray-400 hover:text-black hover:bg-gray-100 disabled:opacity-25 disabled:cursor-not-allowed transition-colors"
                  ><IconMoveDown /></button>
                  <button onClick={() => createNewGroup(path)} title="Add child group"
                    className="w-6 h-6 flex items-center justify-center rounded text-gray-400 hover:text-black hover:bg-gray-100 transition-colors"
                  ><IconPlus /></button>
                  <button onClick={() => deleteGroup(path)} title="Remove group"
                    className="w-6 h-6 flex items-center justify-center rounded text-gray-400 hover:text-red-500 hover:bg-red-50 transition-colors"
                  ><IconX /></button>
                </div>
              </div>
              {isExpanded && hasChildren && renderHierarchy(path, depth + 1)}
            </div>
          );
        })}
      </div>
    );
  };

  const themeFields: { key: 'primaryColor' | 'componentColor' | 'backgroundColor'; label: string }[] = [
    { key: 'primaryColor', label: 'Text' },
    { key: 'componentColor', label: 'Component' },
    { key: 'backgroundColor', label: 'Background' },
  ];

  return (
    <div className="flex h-screen bg-white font-['DM_Sans',sans-serif] overflow-hidden">
      <Sidebar items={sidebarItems} title="Product Catalogs" />

      <main className="flex-1 flex flex-col overflow-hidden">

        {/* ── Top bar ── */}
        <div className="border-b border-black h-14 px-8 flex items-center justify-between flex-shrink-0 bg-white">
          <div className="flex items-center gap-4 min-w-0">
            <span className="text-[10px] tracking-[0.25em] uppercase text-gray-400 hidden md:block flex-shrink-0">Product Catalogs</span>
            {pdfFile && (
              <>
                <span className="text-gray-300 hidden md:block">—</span>
                <span className="font-['Playfair_Display',serif] text-sm font-black text-black truncate max-w-xs italic">
                  {pdfFile.name.replace('.pdf', '')}
                </span>
              </>
            )}
          </div>
          <div className="flex items-center gap-4 flex-shrink-0">
            {pdfFile && totalPages > 0 && (
              <span className="text-[11px] tracking-[0.15em] uppercase text-gray-400 hidden sm:block">
                {currentPage} / {totalPages}
              </span>
            )}
            <button
              onClick={() => fileInputRef.current?.click()}
              className="group inline-flex items-center gap-2.5 border border-black text-black px-5 py-2 text-[11px] tracking-widest uppercase font-semibold hover:bg-black hover:text-white transition-all duration-200"
            >
              <span className="text-base leading-none">+</span>
              <span>Upload PDF</span>
            </button>
          </div>
          <input ref={fileInputRef} type="file" accept=".pdf" onChange={handleFileSelect} className="hidden" />
        </div>

        {/* ── Body ── */}
        {!pdfFile ? (
          <div className="flex-1 bg-white" />
        ) : (
          <div className="flex-1 flex overflow-hidden">

            {/* ── PDF Viewer ── */}
            <div className="flex-1 min-w-0 flex flex-col overflow-hidden bg-gray-50">
              <div className="flex-1 min-h-0 flex items-center gap-4 px-6 overflow-hidden">
                <button
                  onClick={() => setCurrentPage(p => Math.max(p - 1, 1))}
                  disabled={currentPage === 1}
                  className={`w-8 h-8 flex-shrink-0 flex items-center justify-center border text-sm transition-all duration-150 ${currentPage === 1 ? 'border-gray-200 text-gray-300 cursor-not-allowed' : 'border-black text-black hover:bg-black hover:text-white'}`}
                >←</button>

                <div className="flex-1 min-w-0 h-full flex flex-col items-center overflow-hidden">
                  <span className="mt-4 text-[11px] tracking-[0.15em] uppercase text-gray-400 flex-shrink-0 mb-2">
                    Page {currentPage} of {totalPages}
                  </span>
                  <div className="flex-1 w-full overflow-hidden">
                    <PDFViewer
                      pdfUrl={pdfUrl}
                      currentPage={currentPage}
                      onTotalPagesChange={handleTotalPagesLoaded}
                      fitToContainer={true}
                      onInternalLinkClick={(pageNum) => setCurrentPage(pageNum)}
                    />
                  </div>
                </div>

                <button
                  onClick={() => setCurrentPage(p => Math.min(p + 1, totalPages))}
                  disabled={currentPage >= totalPages}
                  className={`w-8 h-8 flex-shrink-0 flex items-center justify-center border text-sm transition-all duration-150 ${currentPage >= totalPages ? 'border-gray-200 text-gray-300 cursor-not-allowed' : 'border-black text-black hover:bg-black hover:text-white'}`}
                >→</button>
              </div>
            </div>

            {/* ── Thumbnails ── */}
            <div className="w-44 border-l border-black bg-white overflow-hidden flex flex-col flex-shrink-0">
              <div className="h-10 border-b border-black flex items-center px-4 flex-shrink-0">
                <span className="text-[10px] tracking-[0.25em] uppercase text-black font-semibold">Pages</span>
                <span className="ml-auto text-[10px] font-mono text-gray-400">{totalPages}</span>
              </div>
              <div className="flex-1 overflow-y-auto">
                {Array.from({ length: totalPages }).map((_, i) => {
                  const pageNum = i + 1;
                  const isActive = currentPage === pageNum;
                  return (
                    <div
                      key={pageNum}
                      onClick={() => setCurrentPage(pageNum)}
                      className={`relative cursor-pointer border-b transition-all duration-150 ${isActive ? 'border-gray-300 bg-gray-100' : 'border-gray-100 hover:border-gray-300 hover:bg-gray-50'}`}
                    >
                      {isActive && <div className="absolute left-0 top-0 h-full w-[3px] bg-black z-10" />}
                      <div className="px-3 py-3">
                        <div className={`w-full border overflow-hidden mb-2 ${isActive ? 'border-gray-300' : 'border-gray-200'}`}>
                          <PDFThumbnail
                            pdfUrl={pdfUrl} pageNum={pageNum} isActive={isActive}
                            title={pageTitles[pageNum - 1] ?? `Title ${pageNum}`}
                            onTitleChange={v => handlePageTitleChange(pageNum, v)}
                            onClick={() => setCurrentPage(pageNum)}
                          />
                        </div>
                        <div className="flex items-center gap-1">
                          <span className={`text-[10px] font-mono flex-shrink-0 ${isActive ? 'text-black' : 'text-gray-400'}`}>
                            {String(pageNum).padStart(2, '0')}
                          </span>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* ── Right Panel ── */}
            <div className="w-72 border-l border-black bg-white flex flex-col flex-shrink-0 overflow-hidden">

              {/* SETTINGS header */}
              <div className="border-b border-black h-10 px-4 flex items-center flex-shrink-0 bg-gray-100">
                <span className="text-[10px] tracking-[0.25em] uppercase text-black font-semibold">Settings</span>
              </div>

              {/* Settings body */}
              <div className="flex-shrink-0 border-b border-black overflow-y-auto bg-gray-100" style={{ maxHeight: '35%' }}>

                {/* Document ID */}
                <div className="px-4 pt-4 pb-2 border-b border-gray-100">
                  <p className="text-[10px] tracking-[0.2em] uppercase text-black font-semibold mb-2">Document ID</p>
                  <input
                    type="text" value={documentId} onChange={e => setDocumentId(e.target.value)}
                    placeholder="e.g. catalog-2024"
                    className="w-full border border-gray-300 focus:border-black px-3 py-2 text-[11px] text-black bg-white outline-none transition-colors placeholder-gray-300"
                  />
                </div>

                {/* Document Name */}
                <div className="px-4 pt-3 pb-2 border-b border-gray-100">
                  <p className="text-[10px] tracking-[0.2em] uppercase text-black font-semibold mb-2">Document Name</p>
                  <input
                    type="text" value={docName} onChange={e => setDocName(e.target.value)}
                    placeholder="Heading shown in preview"
                    className="w-full border border-gray-300 focus:border-black px-3 py-2 text-[11px] text-black bg-white outline-none transition-colors placeholder-gray-300"
                  />
                </div>

                {/* Font Style */}
                <div className="px-4 pt-3 pb-2 border-b border-gray-100">
                  <p className="text-[10px] tracking-[0.2em] uppercase text-black font-semibold mb-2">Font Style</p>
                  <div className="relative">
                    <select
                      value={fontStyle} onChange={e => setFontStyle(e.target.value)}
                      className="w-full border border-gray-300 focus:border-black px-3 py-2 text-[11px] text-black bg-white outline-none transition-colors appearance-none cursor-pointer"
                    >
                      {FONT_OPTIONS.map(f => (
                        <option key={f} value={f}>{f}</option>
                      ))}
                    </select>
                    <svg viewBox="0 0 10 10" className="w-2.5 h-2.5 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-gray-400" fill="currentColor">
                      <path d="M1 3l4 4 4-4" stroke="currentColor" strokeWidth="1.2" fill="none" strokeLinecap="round" />
                    </svg>
                  </div>
                  {/* Live font preview */}
                  <p className="mt-2 text-[11px] text-gray-400 truncate" style={{ fontFamily: fontStyle }}>
                    The quick brown fox
                  </p>
                </div>

                {/* Colour Palette */}
                <div className="px-4 pt-3 pb-3 border-b border-gray-100">
                  <p className="text-[10px] tracking-[0.2em] uppercase text-black font-semibold mb-3">Colour Palette</p>
                  <div className="grid grid-cols-3 gap-2">
                    {themeFields.map(({ key, label }) => (
                      <div key={key}>
                        <p className="text-[8px] tracking-[0.1em] uppercase text-black mb-1.5 font-semibold">{label}</p>
                        <div className="relative">
                          {isValidHex(themeInputs[key]) && (
                            <div
                              className="absolute left-2 top-1/2 -translate-y-1/2 w-2.5 h-2.5 border border-gray-200 pointer-events-none"
                              style={{ backgroundColor: themeInputs[key] }}
                            />
                          )}
                          <input
                            type="text" value={themeInputs[key]}
                            onChange={e => handleThemeInputChange(key, e.target.value)}
                            placeholder="#000000"
                            className={`w-full border px-2 py-1.5 text-[10px] text-black bg-white outline-none transition-colors placeholder-gray-300 ${isValidHex(themeInputs[key]) ? 'pl-[1.4rem]' : ''} ${themeErrors[key] ? 'border-red-300' : 'border-gray-300 focus:border-black'}`}
                          />
                        </div>
                        {themeErrors[key] && <p className="mt-0.5 text-[9px] text-red-500">{themeErrors[key]}</p>}
                      </div>
                    ))}
                  </div>
                </div>

                {/* Preview + Publish (sticky) */}
                <div className="sticky bottom-0 z-10 px-4 py-3 border-t border-gray-100 bg-gray-100">
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      onClick={() => { if (canPublish) { persistHierarchyData(); window.open(`/services/product-catalogs/preview/${documentId}`, '_blank'); } }}
                      disabled={!canPublish}
                      className={`flex items-center justify-center gap-2 py-2.5 text-[10px] tracking-[0.15em] uppercase font-semibold border transition-all duration-150 ${canPublish ? 'border-black text-black hover:bg-black hover:text-white' : 'border-gray-200 text-gray-300 cursor-not-allowed'}`}
                    >
                      <IconEye /><span>Preview</span>
                    </button>
                    <button
                      onClick={() => {}}
                      disabled={!canPublish}
                      className={`flex items-center justify-center gap-2 py-2.5 text-[10px] tracking-[0.15em] uppercase font-semibold border transition-all duration-150 ${canPublish ? 'border-black bg-black text-white hover:bg-white hover:text-black' : 'border-gray-200 text-gray-300 cursor-not-allowed bg-gray-50'}`}
                    >
                      <IconPublish /><span>Publish</span>
                    </button>
                  </div>
                </div>
              </div>

              {/* STRUCTURE header */}
              <div className="border-b border-gray-200 px-4 h-10 flex items-center justify-between flex-shrink-0">
                <div className="flex items-center gap-3">
                  <span className="text-[10px] tracking-[0.25em] uppercase text-black font-semibold">Structure</span>
                </div>
                <button
                  onClick={() => createNewGroup('root')}
                  className="text-[9px] tracking-[0.15em] uppercase font-semibold text-black hover:text-gray-500 transition-colors flex items-center gap-1"
                >
                  <svg viewBox="0 0 10 10" className="w-2 h-2" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round">
                    <path d="M5 1v8M1 5h8" />
                  </svg>
                  Group
                </button>
              </div>

              {/* Error banner */}
              {selectionError && (
                <div className="border-b border-gray-100 bg-gray-50 px-4 py-2 flex items-center justify-between flex-shrink-0">
                  <span className="text-[10px] text-black">{selectionError}</span>
                  <button onClick={() => setSelectionError(null)} className="text-gray-400 hover:text-black transition-colors ml-2 flex-shrink-0">
                    <IconX />
                  </button>
                </div>
              )}

              {/* Selection banner */}
              {selectedPages.size > 0 && (
                <div className="border-b border-black bg-black px-4 py-2 flex items-center justify-between flex-shrink-0">
                  <span className="text-[10px] tracking-[0.15em] uppercase text-white font-semibold">
                    {selectedPages.size} page{selectedPages.size > 1 ? 's' : ''} selected
                  </span>
                  <button onClick={() => { setSelectedPages(new Set()); setSelectionError(null); }} className="text-gray-500 hover:text-white transition-colors">
                    <IconX />
                  </button>
                </div>
              )}

              {/* Tree */}
              <div className="flex-1 overflow-y-auto">
                {Object.keys(pageAssignments).length > 0 ? renderHierarchy() : (
                  <div className="flex flex-col items-center justify-center h-full gap-3 text-center px-6">
                    <svg viewBox="0 0 32 32" className="w-8 h-8 text-gray-200" fill="none" stroke="currentColor" strokeWidth="1.2">
                      <rect x="4" y="4" width="24" height="24" rx="1" />
                      <path d="M4 12h24M12 12v16" strokeLinecap="round" />
                    </svg>
                    <p className="text-[11px] text-gray-400 leading-relaxed">Upload a PDF to build your document structure</p>
                  </div>
                )}
              </div>

            </div>
          </div>
        )}
      </main>
    </div>
  );
}