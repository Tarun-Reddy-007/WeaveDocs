'use client';

import { ChevronDown, ChevronRight } from 'lucide-react';
import {
  getPagesInPath,
  getChildPaths,
  getMinPageInPath,
  getAncestorPaths,
  isPathAGroup,
} from '../lib/pageUtils';

interface HierarchyPanelProps {
  pageAssignments: Record<number, string>;
  groupMetadata: Record<string, { title: string }>;
  pageTitles: string[];
  expandedPaths: Set<string>;
  selectedPath: string;
  currentPageNum: number;
  viewingPathDuringScroll: string;
  primaryColor: string;
  componentColor: string;
  backgroundColor: string;
  fontStyle: string;
  onPathClick: (path: string) => void;
  onPageClick: (path: string, pageNum: number) => void;
  onExpandedPathsChange: (paths: Set<string>) => void;
}

export function HierarchyPanel({
  pageAssignments,
  groupMetadata,
  pageTitles,
  expandedPaths,
  selectedPath,
  currentPageNum,
  viewingPathDuringScroll,
  primaryColor,
  componentColor,
  backgroundColor,
  fontStyle,
  onPathClick,
  onPageClick,
  onExpandedPathsChange,
}: HierarchyPanelProps) {
  const renderHierarchy = (parentPath: string = 'root', depth: number = 0) => {
    const childPaths = getChildPaths(parentPath, groupMetadata);
    const pages = getPagesInPath(parentPath, pageAssignments);

    const items: Array<{ type: 'page' | 'group'; pageNum?: number; path?: string; minPage?: number }> = [];

    pages.forEach(pageNum => {
      items.push({ type: 'page', pageNum, minPage: pageNum });
    });

    childPaths.forEach(childPath => {
      items.push({ type: 'group', path: childPath, minPage: getMinPageInPath(childPath, pageAssignments, groupMetadata) });
    });

    items.sort((a, b) => (a.minPage || Infinity) - (b.minPage || Infinity));

    return (
      <div>
        {items.map((item) => {
          if (item.type === 'page') {
            const pageNum = item.pageNum!;
            const isSelected = selectedPath === parentPath && currentPageNum === pageNum;
            const isViewing = viewingPathDuringScroll === parentPath && currentPageNum === pageNum;
            const shouldHighlight = isSelected || isViewing;
            
            return (
              <div key={`page-${pageNum}`} style={{ paddingLeft: `${depth * 12}px` }} className="mr-6">
                <button
                  onClick={() => onPageClick(parentPath, pageNum)}
                  className={`w-full text-left text-sm py-2 px-3 transition-colors border-r-4 truncate ${shouldHighlight ? 'font-bold' : 'hover:cursor-pointer'}`}
                  style={{
                    color: primaryColor,
                    borderRightColor: shouldHighlight ? componentColor : 'transparent',
                  }}
                >
                  {pageTitles[pageNum - 1] || `Title ${pageNum}`}
                </button>
              </div>
            );
          }

          const path = item.path!;
          const title = groupMetadata[path]?.title || 'Group';
          const groupPages = getPagesInPath(path, pageAssignments);
          const subGroups = getChildPaths(path, groupMetadata);
          const hasChildren = subGroups.length > 0 || groupPages.length > 0;
          const isGroupExpanded = expandedPaths.has(path);
          const isSelected = selectedPath === path;
          const isInViewingBreadcrumb = getAncestorPaths(viewingPathDuringScroll).includes(path);
          const shouldHighlight = isSelected || isInViewingBreadcrumb;

          return (
            <div key={path}>
              <div style={{ paddingLeft: `${depth * 12}px` }} className="mr-6">
                <div className="flex items-center gap-1">
                  {hasChildren && (
                    <button
                      type="button"
                      onClick={() => {
                        const next = new Set(expandedPaths);
                        if (next.has(path)) {
                          next.delete(path);
                        } else {
                          next.add(path);
                        }
                        onExpandedPathsChange(next);
                      }}
                      className="flex-shrink-0 w-5 flex items-center justify-center font-semibold"
                      style={{ color: primaryColor }}
                    >
                      {isGroupExpanded ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
                    </button>
                  )}
                  {!hasChildren && <span className="w-5"></span>}

                  <button
                    onClick={() => onPathClick(path)}
                    className={`flex-1 text-left text-sm py-2 px-2 transition-colors border-r-4 truncate ${shouldHighlight ? 'font-bold' : 'hover:cursor-pointer'}`}
                    style={{
                      color: primaryColor,
                      borderRightColor: shouldHighlight ? componentColor : 'transparent',
                    }}
                  >
                    {title}
                  </button>
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

  return (
    <div
      className="w-96 overflow-y-auto flex flex-col pl-16"
      style={{
        backgroundColor,
        fontFamily: fontStyle,
        scrollbarWidth: 'thin',
        scrollbarColor: `${componentColor} transparent`,
      }}
    >
      <style>{`
        div::-webkit-scrollbar {
          width: 4px;
        }
        div::-webkit-scrollbar-track {
          background: transparent;
        }
        div::-webkit-scrollbar-thumb {
          background-color: ${componentColor};
          border-radius: 2px;
        }
      `}</style>
      <div className="flex-1 overflow-auto">
        <nav className="py-2">
          {renderHierarchy()}
        </nav>
      </div>
    </div>
  );
}
