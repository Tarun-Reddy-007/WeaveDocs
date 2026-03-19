'use client';

import { useState, useRef } from 'react';
import dynamic from 'next/dynamic';
import { ChevronDown, ChevronRight } from 'lucide-react';
import { Sidebar } from '@/components/layout/sidebar/Sidebar';
import { useHierarchy } from '@/lib/HierarchyContext';

type PageAssignment = {
    [pageNum: number]: string; // path like "" (root), "Parent 1", "Parent 1/Child 1"
};

type GroupMetadata = {
    [path: string]: {
        title: string;
    };
};

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



const getPagesInPath = (path: string, assignments: PageAssignment): number[] => {
    return Object.entries(assignments)
        .filter(([, p]) => p === path)
        .map(([pageNum]) => parseInt(pageNum, 10))
        .sort((a, b) => a - b);
};

const getChildPaths = (parentPath: string, metadata: GroupMetadata): string[] => {
    const prefix = parentPath === 'root' ? '' : `${parentPath}/`;
    const children = new Set<string>();

    Object.keys(metadata).forEach((path) => {
        if (path !== 'root') {
            if (prefix === '' && !path.includes('/')) {
                // Top-level children
                children.add(path);
            } else if (prefix && path.startsWith(prefix) && !path.slice(prefix.length).includes('/')) {
                // Direct children of this parent
                children.add(path);
            }
        }
    });

    return Array.from(children).sort();
};

export default function ProductCatalogsPage() {
    const { setHierarchyData } = useHierarchy();

    const [pdfFile, setPdfFile] = useState<File | null>(null);
    const [currentPage, setCurrentPage] = useState(1);
    const [totalPages, setTotalPages] = useState(0);
    const [pdfUrl, setPdfUrl] = useState<string | null>(null);
    const [pageTitles, setPageTitles] = useState<string[]>([]);

    // New simplified state
    const [pageAssignments, setPageAssignments] = useState<PageAssignment>({});
    const [groupMetadata, setGroupMetadata] = useState<GroupMetadata>({ 'root': { title: 'All Pages' } });
    const [expandedPaths, setExpandedPaths] = useState<Set<string>>(new Set(['root']));
    const [selectedPages, setSelectedPages] = useState<Set<number>>(new Set());
    const [selectionError, setSelectionError] = useState<string | null>(null);
    const [editingPath, setEditingPath] = useState<string | null>(null);
    const [tempTitle, setTempTitle] = useState('');
    const [hierarchyReady, setHierarchyReady] = useState(false);
    const [documentId, setDocumentId] = useState('');
    const [docName, setDocName] = useState('');
    const [fontStyle, setFontStyle] = useState('Arial');
    const [themeInputs, setThemeInputs] = useState({
        primaryColor: '',
        componentColor: '',
        backgroundColor: '',
    });
    const [themeErrors, setThemeErrors] = useState<Record<string, string>>({});

    const fileInputRef = useRef<HTMLInputElement>(null);

    const isValidHex = (value: string) => /^#([0-9A-Fa-f]{6})$/.test(value.trim());
    const hasAllThemeColors =
        isValidHex(themeInputs.primaryColor) &&
        isValidHex(themeInputs.componentColor) &&
        isValidHex(themeInputs.backgroundColor);

    const persistHierarchyData = () => {
        setHierarchyData({
            documentId,
            docName,
            pdfUrl: pdfUrl || '',
            pageAssignments,
            groupMetadata,
            pageTitles,
            pdfFileName: pdfFile?.name,
            themeColors: hasAllThemeColors
                ? {
                    primaryColor: themeInputs.primaryColor.trim(),
                    componentColor: themeInputs.componentColor.trim(),
                    backgroundColor: themeInputs.backgroundColor.trim(),
                    fontStyle,
                }
                : null,
        });
    };

    const handleCreateClick = () => {
        fileInputRef.current?.click();
    };

    const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file && file.type === 'application/pdf') {
            if (pdfUrl) {
                URL.revokeObjectURL(pdfUrl);
            }

            const url = URL.createObjectURL(file);
            setPdfFile(file);
            setPdfUrl(url);
            setCurrentPage(1);
            setTotalPages(0);
            setPageTitles([]);
            setPageAssignments({});
            setGroupMetadata({});
            setExpandedPaths(new Set());
            setEditingPath(null);
            setSelectedPages(new Set());
            setSelectionError(null);
            setHierarchyReady(false);
            setDocumentId('');
            setDocName('');
            setFontStyle('Arial');
            setThemeInputs({
                primaryColor: '',
                componentColor: '',
                backgroundColor: '',
            });
            setThemeErrors({});
        } else {
            alert('Please select a valid PDF file');
        }
    };

    const handleTotalPagesLoaded = (total: number) => {
        setTotalPages(total);

        if (!hierarchyReady) {
            setPageTitles(Array.from({ length: total }, (_, i) => `Title ${i + 1}`));
            const initialAssignments: PageAssignment = {};
            for (let i = 1; i <= total; i++) {
                initialAssignments[i] = 'root';
            }

            setPageAssignments(initialAssignments);
            setGroupMetadata({ 'root': { title: 'All Pages' } });
            setExpandedPaths(new Set(['root']));
            setSelectedPages(new Set());
            setSelectionError(null);
            setHierarchyReady(true);
        }
    };

    const handlePageTitleChange = (pageNum: number, value: string) => {
        setPageTitles((prev) => prev.map((title, index) => (
            index === pageNum - 1 ? value : title
        )));
    };

    // Create a new group/folder
    const createNewGroup = (parentPath: string, groupName?: string) => {
        const title = groupName || `Group ${Object.keys(groupMetadata).filter(p => p !== 'root').length + 1}`;
        const newPath = parentPath === 'root'
            ? title
            : `${parentPath}/${title}`;

        setGroupMetadata(prev => ({
            ...prev,
            [newPath]: { title }
        }));

        setExpandedPaths(prev => new Set([...prev, newPath]));
    };

    // Rename a group
    const renameGroup = (path: string, newTitle: string) => {
        if (path === 'root') return; // Can't rename root

        const parentPath = path.substring(0, path.lastIndexOf('/')) || 'root';
        const oldPath = path;
        const newPath = parentPath === 'root'
            ? newTitle
            : `${parentPath}/${newTitle}`;

        setGroupMetadata(prev => {
            const updated = { ...prev };
            const metadata = updated[oldPath];
            delete updated[oldPath];
            updated[newPath] = { ...metadata, title: newTitle };
            return updated;
        });

        setPageAssignments(prev => {
            const updated = { ...prev };
            Object.entries(prev).forEach(([pageNum, p]) => {
                if (p === oldPath) {
                    updated[parseInt(pageNum, 10)] = newPath;
                }
            });
            return updated;
        });

        // Update expanded paths
        setExpandedPaths(prev => {
            const updated = new Set(prev);
            if (updated.has(oldPath)) {
                updated.delete(oldPath);
                updated.add(newPath);
            }
            return updated;
        });
    };

    const deleteGroup = (path: string) => {
        if (path === 'root') return;

        const parentPath = path.substring(0, path.lastIndexOf('/')) || 'root';

        setPageAssignments(prev => {
            const updated = { ...prev };
            Object.entries(prev).forEach(([pageNum, assignedPath]) => {
                if (assignedPath === path || assignedPath.startsWith(path + '/')) {
                    updated[parseInt(pageNum, 10)] = parentPath;
                }
            });
            return updated;
        });

        setGroupMetadata(prev => {
            const updated = { ...prev };
            delete updated[path];
            const childrenToDelete = Object.keys(updated).filter(key =>
                key.startsWith(path + '/')
            );
            childrenToDelete.forEach(child => {
                delete updated[child];
            });

            return updated;
        });

        setExpandedPaths(prev => {
            const updated = new Set(prev);
            updated.delete(path);
            const toRemove = Array.from(updated).filter(expandedPath =>
                expandedPath.startsWith(path + '/')
            );
            toRemove.forEach(expandedPath => updated.delete(expandedPath));
            return updated;
        });
    };

    const areConsecutive = (pageNums: number[]): boolean => {
        if (pageNums.length === 0) return true;
        const sorted = [...pageNums].sort((a, b) => a - b);
        for (let i = 1; i < sorted.length; i++) {
            if (sorted[i] !== sorted[i - 1] + 1) return false;
        }
        return true;
    };

    const moveSelectedPages = (targetPath: string) => {
        if (selectedPages.size === 0) {
            setSelectionError('No pages selected.');
            return;
        }
        const selectedPageNums = Array.from(selectedPages).map(p => Number(p)).sort((a, b) => a - b);
        const selectedSet = new Set(selectedPageNums);

        if (!areConsecutive(selectedPageNums)) {
            setSelectionError('Can only move consecutive pages together.');
            return;
        }

        const sourceGroups = new Set<string>();
        selectedPageNums.forEach(pageNum => {
            sourceGroups.add(pageAssignments[pageNum] || 'root');
        });
        if (sourceGroups.size > 1) {
            setSelectionError('All selected pages must be from the same group.');
            return;
        }

        const sourceGroup = Array.from(sourceGroups)[0];

        if (sourceGroup === targetPath) {
            setSelectionError('Already in this group.');
            return;
        }

        const nextAssignments: PageAssignment = { ...pageAssignments };
        selectedSet.forEach((pageNum) => {
            nextAssignments[pageNum] = targetPath;
        });

        const flattenedSequence = getFlattenedPageSequence('root', nextAssignments, groupMetadata);
        const preservesGlobalSequence =
            flattenedSequence.length === totalPages &&
            flattenedSequence.every((pageNum, index) => pageNum === index + 1);

        if (!preservesGlobalSequence) {
            setSelectionError('Cannot move - would break the global page sequence.');
            return;
        }

        setPageAssignments(prev => {
            const updated = { ...prev };
            selectedPageNums.forEach(pageNum => {
                updated[pageNum] = targetPath;
            });
            return updated;
        });

        setSelectedPages(new Set());
        setSelectionError(null);
    };

    // Get minimum page number in a group (recursive)
    const getMinPageInPath = (path: string, assignments: PageAssignment, metadata: GroupMetadata): number => {
        const directPages = getPagesInPath(path, assignments);
        if (directPages.length > 0) return Math.min(...directPages);

        // Check child groups
        const childPaths = getChildPaths(path, metadata);
        const childMins = childPaths
            .map(childPath => getMinPageInPath(childPath, assignments, metadata))
            .filter(n => !isNaN(n));

        return childMins.length > 0 ? Math.min(...childMins) : Infinity;
    };

    const getOrderedItems = (parentPath: string, assignments: PageAssignment, metadata: GroupMetadata) => {
        const childPaths = getChildPaths(parentPath, metadata);
        const pages = getPagesInPath(parentPath, assignments);
        const items: Array<{ type: 'page' | 'group'; pageNum?: number; path?: string; minPage?: number; isEmpty?: boolean }> = [];

        pages.forEach(pageNum => {
            items.push({ type: 'page', pageNum, minPage: pageNum, isEmpty: false });
        });

        childPaths.forEach(childPath => {
            const minPage = getMinPageInPath(childPath, assignments, metadata);
            const isEmpty = minPage === Infinity;
            items.push({ type: 'group', path: childPath, minPage, isEmpty });
        });

        items.sort((a, b) => {
            if (a.isEmpty && !b.isEmpty) return -1;
            if (!a.isEmpty && b.isEmpty) return 1;
            return (a.minPage || Infinity) - (b.minPage || Infinity);
        });

        return items;
    };

    const getFlattenedPageSequence = (
        parentPath: string,
        assignments: PageAssignment,
        metadata: GroupMetadata
    ): number[] => {
        return getOrderedItems(parentPath, assignments, metadata).flatMap((item) => {
            if (item.type === 'page') {
                return item.pageNum ? [item.pageNum] : [];
            }

            return item.path ? getFlattenedPageSequence(item.path, assignments, metadata) : [];
        });
    };

    // Render the hierarchy tree from flat data
    const renderHierarchy = (parentPath: string = 'root', depth: number = 0): React.ReactNode => {
        const items = getOrderedItems(parentPath, pageAssignments, groupMetadata);

        return (
            <div>
                {items.map((item) => {
                    if (item.type === 'page') {
                        const pageNum = item.pageNum!;
                        const defaultTitle = `Title ${pageNum}`;
                        const pageTitle = pageTitles[pageNum - 1] !== undefined ? pageTitles[pageNum - 1] : defaultTitle;
                        const isSelected = selectedPages.has(pageNum);
                        const isEditing = editingPath === `page-${pageNum}`;

                        return (
                            <div key={`page-${pageNum}`} style={{ paddingLeft: `${depth * 16}px` }} className="group">
                                <div className={`flex items-center gap-2 py-1 px-2 rounded ${isSelected ? 'bg-blue-100' : 'hover:bg-gray-100'} cursor-pointer`}>
                                    <input
                                        type="checkbox"
                                        checked={isSelected}
                                        onChange={(e) => {
                                            if (e.target.checked) {
                                                const newSelection = new Set([...selectedPages, pageNum]);
                                                const pageArray = Array.from(newSelection).sort((a, b) => a - b);
                                                if (!areConsecutive(pageArray)) {
                                                    setSelectionError('Select only consecutive pages.');
                                                    return;
                                                }
                                                setSelectedPages(newSelection);
                                                setSelectionError(null);
                                            } else {
                                                setSelectedPages(prev => {
                                                    const next = new Set(prev);
                                                    next.delete(pageNum);
                                                    return next;
                                                });
                                                setSelectionError(null);
                                            }
                                        }}
                                        className="flex-shrink-0 h-4 w-4"
                                    />
                                    <span className="w-4 text-center text-gray-400 text-xs">📄</span>
                                    <span className="bg-black text-white text-xs font-medium w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0">{pageNum}</span>
                                    {isEditing ? (
                                        <input
                                            autoFocus
                                            value={tempTitle}
                                            onChange={(e) => setTempTitle(e.target.value)}
                                            onBlur={() => {
                                                if (tempTitle.trim()) {
                                                    handlePageTitleChange(pageNum, tempTitle);
                                                }
                                                setEditingPath(null);
                                            }}
                                            onKeyDown={(e) => {
                                                if (e.key === 'Enter') {
                                                    if (tempTitle.trim()) handlePageTitleChange(pageNum, tempTitle);
                                                    setEditingPath(null);
                                                }
                                                if (e.key === 'Escape') setEditingPath(null);
                                            }}
                                            onClick={(e) => e.stopPropagation()}
                                            className="flex-1 bg-white border border-blue-400 rounded px-1 py-0 text-sm text-black"
                                        />
                                    ) : (
                                        <button
                                            onClick={() => {
                                                setEditingPath(`page-${pageNum}`);
                                                setTempTitle(pageTitle);
                                            }}
                                            className="flex-1 text-left text-sm text-gray-900 hover:text-black truncate"
                                        >
                                            {pageTitle}
                                        </button>
                                    )}
                                </div>
                            </div>
                        );
                    }

                    // Type: group
                    const path = item.path!;
                    const groupTitle = groupMetadata[path]?.title || 'Unnamed Group';
                    const childPages = getPagesInPath(path, pageAssignments);
                    const subGroups = getChildPaths(path, groupMetadata);
                    const hasChildren = subGroups.length > 0 || childPages.length > 0;
                    const isGroupExpanded = expandedPaths.has(path);
                    const isEmpty = childPages.length === 0 && subGroups.length === 0;
                    const isEditing = editingPath === path;

                    return (
                        <div key={path}>
                            <div style={{ paddingLeft: `${depth * 16}px` }} className={`group ${isEmpty ? 'bg-red-50' : ''}`}>
                                <div className={`flex items-center gap-1 py-1 px-2 rounded ${isEmpty ? 'border border-red-200' : 'hover:bg-gray-100'}`}>
                                    <div className="flex items-center gap-1">
                                        {hasChildren && (
                                            <button
                                                type="button"
                                                onClick={() => {
                                                    setExpandedPaths(prev => {
                                                        const next = new Set(prev);
                                                        if (next.has(path)) {
                                                            next.delete(path);
                                                        } else {
                                                            next.add(path);
                                                        }
                                                        return next;
                                                    });
                                                }}
                                                className="flex-shrink-0 w-5 flex items-center justify-center text-gray-400 hover:text-gray-600"
                                            >
                                                {isGroupExpanded ? <ChevronDown className="h-3.5 w-3.5" /> : <ChevronRight className="h-3.5 w-3.5" />}
                                            </button>
                                        )}
                                        {!hasChildren && <span className="w-5"></span>}
                                    </div>

                                    <span className={`text-sm ${isEmpty ? 'text-red-400' : 'text-gray-400'}`}>📁</span>

                                    {isEditing ? (
                                        <input
                                            autoFocus
                                            value={tempTitle}
                                            onChange={(e) => setTempTitle(e.target.value)}
                                            onBlur={() => {
                                                if (tempTitle.trim()) {
                                                    renameGroup(path, tempTitle);
                                                }
                                                setEditingPath(null);
                                            }}
                                            onKeyDown={(e) => {
                                                if (e.key === 'Enter') {
                                                    if (tempTitle.trim()) renameGroup(path, tempTitle);
                                                    setEditingPath(null);
                                                }
                                                if (e.key === 'Escape') setEditingPath(null);
                                            }}
                                            onClick={(e) => e.stopPropagation()}
                                            className="flex-1 bg-white border border-blue-400 rounded px-1 py-0 text-sm text-black"
                                        />
                                    ) : (
                                        <button
                                            onClick={() => {
                                                setEditingPath(path);
                                                setTempTitle(groupTitle);
                                            }}
                                            className="flex-1 text-left text-sm font-medium text-gray-900 hover:text-black truncate"
                                        >
                                            {groupTitle}
                                            {isEmpty && <span className="text-red-500 ml-1 font-normal text-xs">✕ empty</span>}
                                        </button>
                                    )}

                                    <div className="opacity-0 group-hover:opacity-100 flex items-center gap-1 flex-shrink-0">
                                        <button
                                            type="button"
                                            onClick={() => moveSelectedPages(path)}
                                            title="Move selected here"
                                            disabled={selectedPages.size === 0}
                                            className="p-1 rounded hover:bg-green-100 text-xs text-gray-600 hover:text-green-600 disabled:opacity-50 disabled:cursor-not-allowed"
                                        >
                                            ⬇️
                                        </button>
                                        <button
                                            type="button"
                                            onClick={() => createNewGroup(path)}
                                            title="Add child"
                                            className="p-1 rounded hover:bg-gray-200 text-xs text-gray-600 hover:text-gray-800"
                                        >
                                            ➕
                                        </button>
                                        <button
                                            type="button"
                                            onClick={() => deleteGroup(path)}
                                            title="Remove group"
                                            className="p-1 rounded hover:bg-red-100 text-xs text-gray-600 hover:text-red-600"
                                        >
                                            ✕
                                        </button>
                                    </div>
                                </div>
                            </div>

                            {isGroupExpanded && hasChildren && (
                                <div>
                                    {renderHierarchy(path, depth + 1)}
                                </div>
                            )}
                        </div>
                    );
                })}
            </div>
        );
    };

    const handlePreviousPage = () => {
        setCurrentPage(prev => Math.max(prev - 1, 1));
    };

    const handleNextPage = () => {
        setCurrentPage(prev => (prev < totalPages ? prev + 1 : prev));
    };

    const handleThemeInputChange = (key: 'primaryColor' | 'componentColor' | 'backgroundColor', value: string) => {
        setThemeInputs(prev => ({ ...prev, [key]: value }));

        if (!value.trim()) {
            setThemeErrors(prev => ({ ...prev, [key]: 'Color is required.' }));
            return;
        }

        if (!isValidHex(value)) {
            setThemeErrors(prev => ({ ...prev, [key]: 'Use a strict hex color like #1A2B3C.' }));
            return;
        }

        setThemeErrors(prev => {
            const next = { ...prev };
            delete next[key];
            return next;
        });
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
                    <div className="flex-1 flex overflow-hidden min-h-0">

                        {/* Center - Page Viewer */}
                        <div className="flex-1 min-w-0 flex flex-col bg-white overflow-hidden">
                            <div className="flex-1 min-h-0 flex items-center gap-4 px-6 py-0 overflow-hidden">
                                <button
                                    onClick={handlePreviousPage}
                                    disabled={currentPage === 1}
                                    className={`p-3 rounded-lg transition-colors duration-200 ${currentPage === 1
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

                                <div className="flex-1 min-w-0 h-full flex flex-col items-center overflow-hidden">
                                    <span className="mt-4 rounded-lg bg-gray-200 px-3 py-1 text-black font-medium text-center flex-shrink-0">
                                        {currentPage} / {totalPages}
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
                                    onClick={handleNextPage}
                                    disabled={currentPage >= totalPages}
                                    className={`p-3 rounded-lg transition-colors duration-200 ${currentPage >= totalPages
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
                        <div className="w-40 bg-gray-100 border-l border-gray-300 overflow-y-auto p-3">
                            <div className="space-y-2">
                                {Array.from({ length: totalPages }).map((_, index) => {
                                    const pageNum = index + 1;
                                    const isActive = currentPage === pageNum;
                                    const defaultTitle = `Title ${pageNum}`;
                                    const title = pageTitles[pageNum - 1] !== undefined ? pageTitles[pageNum - 1] : defaultTitle;
                                    return (
                                        <PDFThumbnail
                                            key={pageNum}
                                            pdfUrl={pdfUrl}
                                            pageNum={pageNum}
                                            isActive={isActive}
                                            title={title}
                                            onTitleChange={(value) => handlePageTitleChange(pageNum, value)}
                                            onClick={() => setCurrentPage(pageNum)}
                                        />
                                    );
                                })}
                            </div>
                        </div>

                        {/* Right-most - Hierarchy Settings Panel */}
                        <div className="w-80 bg-white border-l border-gray-200 overflow-auto flex flex-col">
                            {/* Document ID Section */}
                            <div className="border-b border-gray-200 bg-gray-200 px-4 pt-1 flex-shrink-0">
                                <div className="flex items-center gap-2">
                                    <label className="text-sm font-semibold text-gray-800 flex-shrink-0">DOC ID</label>
                                    <input
                                        type="text"
                                        value={documentId}
                                        onChange={(e) => setDocumentId(e.target.value)}
                                        placeholder="Document ID"
                                        className="flex-1 px-2 py-1 text-sm border border-gray-300 rounded"
                                    />
                                </div>
                            </div>

                            {/* Document Name Section */}
                            <div className="border-b border-gray-200 bg-gray-200 px-4 flex-shrink-0">
                                <div className="flex items-center gap-2">
                                    <label className="text-sm font-semibold text-gray-800 flex-shrink-0">DOC NAME</label>
                                    <input
                                        type="text"
                                        value={docName}
                                        onChange={(e) => setDocName(e.target.value)}
                                        placeholder="Document name for heading"
                                        className="flex-1 px-2 py-1 text-sm border border-gray-300 rounded"
                                    />
                                </div>
                            </div>

                            {/* Font Style Section */}
                            <div className="border-b border-gray-200 bg-gray-200 p-2 flex-shrink-0">
                                <label className="text-sm font-semibold text-gray-800 block mb-2">Font Style</label>
                                <select
                                    value={fontStyle}
                                    onChange={(e) => setFontStyle(e.target.value)}
                                    className="w-full px-3 py-1 text-sm border border-gray-300 rounded"
                                >
                                    <option value="Arial">Arial</option>
                                    <option value="Arial Rounded MT Bold">Arial Rounded</option>
                                    <option value="Comic Sans MS">Comic Sans MS</option>
                                    <option value="Courier New">Courier New</option>
                                    <option value="Garamond">Garamond</option>
                                    <option value="Georgia">Georgia</option>
                                    <option value="Impact">Impact</option>
                                    <option value="Lucida Console">Lucida Console</option>
                                    <option value="Palatino Linotype">Palatino Linotype</option>
                                    <option value="Segoe UI">Segoe UI</option>
                                    <option value="Tahoma">Tahoma</option>
                                    <option value="Times New Roman">Times New Roman</option>
                                    <option value="Trebuchet MS">Trebuchet MS</option>
                                    <option value="Verdana">Verdana</option>
                                </select>
                            </div>
                            <div className="border-b border-gray-200 bg-gray-200 p-2 flex-shrink-0">
                                <h3 className="text-sm font-semibold text-gray-800">Select color palette</h3>
                                <div className="mt-3 grid grid-cols-3 gap-2">
                                    <div>
                                        <p className="mb-1 text-xs font-medium text-gray-600">Text</p>
                                        <input
                                            type="text"
                                            value={themeInputs.primaryColor}
                                            onChange={(e) => handleThemeInputChange('primaryColor', e.target.value)}
                                            placeholder="Text"
                                            className={`w-full rounded border px-3 py-1 text-sm ${themeErrors.primaryColor ? 'border-red-400' : 'border-gray-300'}`}
                                        />
                                        {themeErrors.primaryColor && (
                                            <p className="mt-1 text-xs text-red-600">{themeErrors.primaryColor}</p>
                                        )}
                                    </div>
                                    <div>
                                        <p className="mb-1 text-xs font-medium text-gray-600">Component</p>
                                        <input
                                            type="text"
                                            value={themeInputs.componentColor}
                                            onChange={(e) => handleThemeInputChange('componentColor', e.target.value)}
                                            placeholder="Component"
                                            className={`w-full rounded border px-3 py-1 text-sm ${themeErrors.componentColor ? 'border-red-400' : 'border-gray-300'}`}
                                        />
                                        {themeErrors.componentColor && (
                                            <p className="mt-1 text-xs text-red-600">{themeErrors.componentColor}</p>
                                        )}
                                    </div>
                                    <div>
                                        <p className="mb-1 text-xs font-medium text-gray-600">Background</p>
                                        <input
                                            type="text"
                                            value={themeInputs.backgroundColor}
                                            onChange={(e) => handleThemeInputChange('backgroundColor', e.target.value)}
                                            placeholder="Background"
                                            className={`w-full rounded border px-3 py-1 text-sm ${themeErrors.backgroundColor ? 'border-red-400' : 'border-gray-300'}`}
                                        />
                                        {themeErrors.backgroundColor && (
                                            <p className="mt-1 text-xs text-red-600">{themeErrors.backgroundColor}</p>
                                        )}
                                    </div>
                                </div>
                            </div>

                            {/* Buttons Section */}
                            <div className="border-b border-gray-200 bg-gray-200 px-2 pb-1 flex-shrink-0">
                                <div className="flex items-center gap-2">
                                    <button
                                        type="button"
                                        onClick={() => {
                                            if (documentId.length > 6 && hasAllThemeColors) {
                                                persistHierarchyData();
                                                window.open(`/services/product-catalogs/preview/${documentId}`, '_blank');
                                            }
                                        }}
                                        disabled={documentId.length <= 6 || !hasAllThemeColors}
                                        className={`flex-1 p-1 rounded text-sm font-medium transition-colors ${documentId.length > 6 && hasAllThemeColors
                                                ? 'bg-black text-white hover:bg-gray-800'
                                                : 'bg-gray-200 text-gray-400 cursor-not-allowed'
                                            }`}
                                        title="Preview document"
                                    >
                                        Preview
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => { }}
                                        disabled={documentId.length <= 6 || !hasAllThemeColors}
                                        className={`flex-1 p-1 rounded text-sm font-medium transition-colors ${documentId.length > 6 && hasAllThemeColors
                                                ? 'bg-black text-white hover:bg-gray-800'
                                                : 'bg-gray-200 text-gray-400 cursor-not-allowed'
                                            }`}
                                        title="Publish document"
                                    >
                                        Publish
                                    </button>
                                </div>
                            </div>

                            <div className="border-t-4 border-b border-gray-300 p-2 flex-shrink-0">
                                <div className="mb-2">
                                    <h3 className="text-sm font-semibold text-gray-800">Structure</h3>
                                </div>
                            </div>

                            <div className="px-4 pt-1 pb-0 flex justify-end flex-shrink-0">
                                <button
                                    type="button"
                                    onClick={() => createNewGroup('root')}
                                    className="rounded bg-black px-2 py-1 text-xs font-medium text-white hover:bg-gray-800"
                                >
                                    + Parent
                                </button>
                            </div>

                            {selectionError && (
                                <div className="border-b border-amber-200 bg-amber-50 px-4 py-2 text-xs text-amber-800">
                                    {selectionError}
                                </div>
                            )}

                            {selectedPages.size > 0 && (
                                <div className="border-b border-blue-200 bg-blue-50 px-4 py-2 flex items-center justify-between text-xs">
                                    <span className="text-blue-900 font-medium">
                                        {selectedPages.size} item{selectedPages.size > 1 ? 's' : ''} selected
                                    </span>
                                    <button
                                        type="button"
                                        onClick={() => {
                                            setSelectedPages(new Set());
                                            setSelectionError(null);
                                        }}
                                        className="text-blue-600 hover:text-blue-800"
                                    >
                                        Clear
                                    </button>
                                </div>
                            )}

                            <div className="flex-1 overflow-auto px-2 pt-0 pb-2">
                                {Object.keys(pageAssignments).length > 0 ? renderHierarchy() : (
                                    <div className="p-4 text-sm text-gray-500 text-center">
                                        Upload a PDF to get started
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
