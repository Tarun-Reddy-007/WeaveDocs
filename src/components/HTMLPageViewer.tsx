'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import type { ParsedHtmlCatalogPage } from '@/lib/indesign-parser';

interface HTMLPageViewerProps {
  page: ParsedHtmlCatalogPage;
  pageTitle?: string;
  renderMode?: 'isolated' | 'dom';
  surfaceStyle?: 'card' | 'flat';
  backgroundColor?: string;
  fillContainer?: boolean;
}

interface HTMLThumbnailProps {
  page: ParsedHtmlCatalogPage;
  pageNum: number;
  isActive: boolean;
  title: string;
  onTitleChange: (title: string) => void;
  onClick: () => void;
}

type EmbeddedDocument = {
  markup: string;
  bodyStyle: string;
  width: number;
  height: number;
};

const EMBED_ROOT_CLASS = 'embedded-html-page-root';
const EMBED_CONTENT_CLASS = 'embedded-html-page-content';

function useContainerSize<T extends HTMLElement>() {
  const ref = useRef<T | null>(null);
  const [size, setSize] = useState({ width: 0, height: 0 });

  useEffect(() => {
    const element = ref.current;
    if (!element) return;

    const observer = new ResizeObserver(([entry]) => {
      const nextWidth = entry.contentRect.width;
      const nextHeight = entry.contentRect.height;
      setSize((current) =>
        current.width === nextWidth && current.height === nextHeight
          ? current
          : { width: nextWidth, height: nextHeight },
      );
    });

    observer.observe(element);
    return () => observer.disconnect();
  }, []);

  return { ref, size };
}

function scopeCss(css: string) {
  return css
    // Replace html and body selectors while being careful with pseudo-elements and functions
    .replace(/(^|}|,)\s*html(?=[\s.#:[>{,]|$)/g, `$1 .${EMBED_ROOT_CLASS}`)
    .replace(/(^|}|,)\s*body(?=[\s.#:[>{,]|$)/g, `$1 .${EMBED_CONTENT_CLASS}`)
    // Ensure links, buttons, and form elements remain interactive
    .replace(/^([^{]*?a[^{]*?)\{\s*pointer-events:\s*none/gm, '$1 { pointer-events: auto')
    .replace(/^([^{]*?)input[^{]*?\{\s*pointer-events:\s*none/gm, '$1 input { pointer-events: auto')
    .replace(/^([^{]*?)button[^{]*?\{\s*pointer-events:\s*none/gm, '$1 button { pointer-events: auto')
    .replace(/^([^{]*?)textarea[^{]*?\{\s*pointer-events:\s*none/gm, '$1 textarea { pointer-events: auto');
}

function buildEmbeddedDocument(page: ParsedHtmlCatalogPage): EmbeddedDocument {
  const parser = new DOMParser();
  const doc = parser.parseFromString(page.html, 'text/html');
  const styles = Array.from(doc.querySelectorAll('style'))
    .map((node) => scopeCss(node.textContent || ''))
    .join('\n');
  const body = doc.body;
  const bodyStyle = body?.getAttribute('style') || '';
  const bodyClass = body?.getAttribute('class') || '';
  const bodyId = body?.getAttribute('id') || '';
  const bodyAttributes = [
    bodyId ? `id="${bodyId.replace(/"/g, '&quot;')}"` : '',
    bodyClass ? `class="${EMBED_CONTENT_CLASS} ${bodyClass.replace(/"/g, '&quot;')}"` : `class="${EMBED_CONTENT_CLASS}"`,
    bodyStyle ? `style="${bodyStyle.replace(/"/g, '&quot;')}"` : '',
  ].filter(Boolean).join(' ');

  const scripts = Array.from(doc.querySelectorAll('script'))
    .map((node) => node.outerHTML)
    .join('');

  // Add essential styles to ensure interactivity of links, buttons, and forms
  const interactiveStyles = `
    .${EMBED_CONTENT_CLASS},
    .${EMBED_CONTENT_CLASS} * {
      user-select: text !important;
      -webkit-user-select: text !important;
      -moz-user-select: text !important;
    }
    .${EMBED_CONTENT_CLASS} [data-semantic-text] {
      pointer-events: auto !important;
      user-select: text !important;
      -webkit-user-select: text !important;
    }
    .${EMBED_CONTENT_CLASS} a,
    .${EMBED_CONTENT_CLASS} button,
    .${EMBED_CONTENT_CLASS} input,
    .${EMBED_CONTENT_CLASS} textarea,
    .${EMBED_CONTENT_CLASS} select {
      pointer-events: auto !important;
      cursor: pointer !important;
    }
    .${EMBED_CONTENT_CLASS} input:focus,
    .${EMBED_CONTENT_CLASS} textarea:focus,
    .${EMBED_CONTENT_CLASS} select:focus {
      outline: auto !important;
    }
  `;

  return {
    markup: `
      <style>${styles}${interactiveStyles}</style>
      <div ${bodyAttributes}>${body?.innerHTML || ''}</div>
      ${scripts}
    `,
    bodyStyle,
    width: page.width,
    height: page.height,
  };
}

function executeEmbeddedScripts(container: HTMLElement) {
  const scripts = Array.from(container.querySelectorAll('script'));
  scripts.forEach((script) => {
    const replacement = document.createElement('script');
    Array.from(script.attributes).forEach((attribute) => {
      replacement.setAttribute(attribute.name, attribute.value);
    });
    replacement.textContent = script.textContent;
    script.parentNode?.replaceChild(replacement, script);
  });
}

function InlineHtmlFrame({
  html,
  width,
  height,
  scale,
  title,
  interactive = false,
}: {
  html: string;
  width: number;
  height: number;
  scale: number;
  title: string;
  interactive?: boolean;
}) {
  return (
    <div style={{ width: width * scale, height: height * scale }}>
      <iframe
        title={title}
        sandbox={interactive ? "allow-scripts allow-same-origin" : "allow-scripts"}
        srcDoc={html}
        className="block border-0 bg-white"
        style={{
          width,
          height,
          transform: `scale(${scale})`,
          transformOrigin: 'top left',
          pointerEvents: interactive ? 'auto' : 'none',
          cursor: interactive ? 'auto' : 'default',
        }}
      />
    </div>
  );
}

export function HTMLPageViewer({ page, pageTitle, renderMode = 'isolated', surfaceStyle = 'card', backgroundColor, fillContainer = false }: HTMLPageViewerProps) {
  const { ref, size } = useContainerSize<HTMLDivElement>();
  const contentRef = useRef<HTMLDivElement | null>(null);

  const embeddedDocument = useMemo(() => buildEmbeddedDocument(page), [page]);

  const scale = useMemo(() => {
    if (!size.width) return 1;
    // For fillContainer mode (group view), scale to fill width
    if (fillContainer) {
      return Math.max(0.1, (size.width - 32) / page.width);
    }
    // For single page view, fit within container
    if (!size.height) return 1;
    const widthScale = Math.max(0.1, (size.width - 32) / page.width);
    const heightScale = Math.max(0.1, (size.height - 32) / page.height);
    return Math.min(widthScale, heightScale, 1);
  }, [page.height, page.width, size.height, size.width, fillContainer]);

  useEffect(() => {
    if (renderMode !== 'dom') return;
    if (contentRef.current) {
      executeEmbeddedScripts(contentRef.current);
    }
  }, [embeddedDocument.markup, renderMode]);

  const containerBgColor = backgroundColor || (surfaceStyle === 'flat' ? 'transparent' : '#f3f4f6');

  return (
    <div
      ref={ref}
      className={renderMode === 'dom' ? 'w-full h-full overflow-auto' : 'w-full h-full overflow-auto'}
      style={{
        backgroundColor: containerBgColor,
        scrollbarWidth: 'thin',
        scrollbarColor: '#d1d5db transparent',
        userSelect: 'text',
      }}
    >
      <div className="flex items-start justify-center p-4">
        {renderMode === 'dom' ? (
          <div
            className={EMBED_ROOT_CLASS}
            style={{
              width: embeddedDocument.width * scale,
              height: embeddedDocument.height * scale,
              overflow: 'hidden',
              background: surfaceStyle === 'flat' ? 'transparent' : '#fff',
              boxShadow: surfaceStyle === 'flat' ? 'none' : '0 2px 16px 0 rgba(0,0,0,0.08)',
              pointerEvents: 'auto',
              userSelect: 'text',
              WebkitUserSelect: 'text',
            }}
          >
            <div
              ref={contentRef}
              style={{
                width: embeddedDocument.width,
                minWidth: embeddedDocument.width,
                height: embeddedDocument.height,
                minHeight: embeddedDocument.height,
                zoom: scale,
                pointerEvents: 'auto',
                userSelect: 'text',
                WebkitUserSelect: 'text',
                position: 'relative',
              }}
              dangerouslySetInnerHTML={{ __html: embeddedDocument.markup }}
            />
          </div>
        ) : (
          <InlineHtmlFrame
            html={page.html}
            width={page.width}
            height={page.height}
            scale={scale}
            title={pageTitle || page.title}
            interactive={false}
          />
        )}
      </div>

      <div className="sr-only" data-ai-readable="true" data-page-number={page.pageNumber}>
        <h2>{pageTitle || page.title}</h2>
        <p>{page.plainText}</p>
      </div>
    </div>
  );
}

export function HTMLThumbnail({
  page,
  pageNum,
  isActive,
  title,
  onTitleChange,
  onClick,
}: HTMLThumbnailProps) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const [thumbWidth, setThumbWidth] = useState<number>(0);
  const [isEditingTitle, setIsEditingTitle] = useState(false);

  useEffect(() => {
    if (!containerRef.current) return;
    setThumbWidth(containerRef.current.clientWidth);
    const ro = new ResizeObserver(entries => {
      for (const entry of entries) setThumbWidth(Math.floor(entry.contentRect.width));
    });
    ro.observe(containerRef.current);
    return () => ro.disconnect();
  }, []);

  const thumbnailWidth = thumbWidth > 0 ? Math.max(60, thumbWidth) : 112;
  const scale = Math.min(thumbnailWidth / page.width, 146 / page.height);

  return (
    <div
      onClick={onClick}
      role="button"
      tabIndex={0}
      onKeyDown={e => { if (e.key === 'Enter') onClick(); }}
      className="w-full flex flex-col cursor-pointer font-['DM_Sans',sans-serif] group"
    >
      {/* Title — click to edit */}
      <div className="mb-1.5 px-0.5">
        {isEditingTitle ? (
          <input
            autoFocus
            value={title}
            onChange={e => onTitleChange(e.target.value)}
            onClick={e => e.stopPropagation()}
            onBlur={() => setIsEditingTitle(false)}
            onKeyDown={e => {
              if (e.key === 'Enter' || e.key === 'Escape') {
                e.stopPropagation();
                setIsEditingTitle(false);
              }
            }}
            className="w-full border-b border-black bg-transparent text-[10px] text-black outline-none py-0.5 font-['DM_Sans',sans-serif]"
          />
        ) : (
          <button
            onClick={e => { e.stopPropagation(); setIsEditingTitle(true); }}
            className={`w-full text-left text-[10px] truncate transition-colors ${
              isActive ? 'text-black font-semibold' : 'text-black hover:text-black'
            }`}
          >
            {title}
          </button>
        )}
      </div>

      {/* HTML thumbnail */}
      <div
        ref={containerRef}
        className={`w-full overflow-hidden flex items-center justify-center transition-all duration-150 ${
          isActive
            ? 'ring-[1.5px] ring-gray-400 shadow-[0_2px_8px_0_rgba(0,0,0,0.12)]'
            : 'ring-[1px] ring-gray-200 group-hover:ring-gray-400'
        }`}
        style={{ height: 146 }}
      >
        <InlineHtmlFrame
          html={page.html}
          width={page.width}
          height={page.height}
          scale={scale}
          title={page.title}
        />
      </div>
    </div>
  );
}
