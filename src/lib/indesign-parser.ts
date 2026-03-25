import JSZip from 'jszip';

export interface TextElement {
  text: string;
  top: number;
  left: number;
  fontSize: number;
  fontWeight?: string;
}

export interface ImageElement {
  id: string;
  src: string;
  alt: string;
  top?: number;
  left?: number;
}

export interface ParsedHtmlCatalogPage {
  pageNumber: number;
  title: string;
  textElements: TextElement[];
  images: ImageElement[];
  rawHtml: string;
  html: string;
  plainText: string;
  width: number;
  height: number;
  filePath: string;
}

export interface ParsedHtmlCatalog {
  sourceName: string;
  pages: ParsedHtmlCatalogPage[];
  totalPages: number;
  combinedHtml: string;
}

type ArchiveAsset = {
  path: string;
  mimeType: string;
  dataUrl: string;
  text?: string;
};

const PAGE_FILE_PATTERNS = [/(\d+)(?:\.\w+)?$/];

const MIME_TYPES: Record<string, string> = {
  '.css': 'text/css',
  '.gif': 'image/gif',
  '.htm': 'text/html',
  '.html': 'text/html',
  '.jpeg': 'image/jpeg',
  '.jpg': 'image/jpeg',
  '.js': 'text/javascript',
  '.json': 'application/json',
  '.png': 'image/png',
  '.svg': 'image/svg+xml',
  '.ttf': 'font/ttf',
  '.txt': 'text/plain',
  '.webp': 'image/webp',
  '.woff': 'font/woff',
  '.woff2': 'font/woff2',
};

function normalizePath(path: string): string {
  return path.replace(/\\/g, '/').replace(/^\.\//, '').replace(/^\//, '');
}

function getFileExtension(path: string): string {
  const normalized = normalizePath(path);
  const index = normalized.lastIndexOf('.');
  return index >= 0 ? normalized.slice(index).toLowerCase() : '';
}

function getMimeType(path: string): string {
  return MIME_TYPES[getFileExtension(path)] || 'application/octet-stream';
}

function dirname(path: string): string {
  const normalized = normalizePath(path);
  const index = normalized.lastIndexOf('/');
  return index >= 0 ? normalized.slice(0, index) : '';
}

function resolveRelativePath(basePath: string, targetPath: string): string {
  if (!targetPath || /^([a-z]+:|data:|#|\/\/)/i.test(targetPath)) return targetPath;

  const cleanTarget = targetPath.split('#')[0].split('?')[0];
  const baseSegments = dirname(basePath).split('/').filter(Boolean);
  const targetSegments = cleanTarget.split('/').filter(Boolean);
  const resolved = [...baseSegments];

  targetSegments.forEach((segment) => {
    if (segment === '.') return;
    if (segment === '..') {
      resolved.pop();
      return;
    }
    resolved.push(segment);
  });

  return resolved.join('/');
}

function bytesToBase64(bytes: Uint8Array): string {
  let binary = '';
  const chunkSize = 0x8000;
  for (let i = 0; i < bytes.length; i += chunkSize) {
    const chunk = bytes.subarray(i, i + chunkSize);
    binary += String.fromCharCode(...chunk);
  }
  return btoa(binary);
}

function textToDataUrl(text: string, mimeType: string): string {
  return `data:${mimeType};base64,${bytesToBase64(new TextEncoder().encode(text))}`;
}

function binaryToDataUrl(bytes: Uint8Array, mimeType: string): string {
  return `data:${mimeType};base64,${bytesToBase64(bytes)}`;
}

function extractPositionValue(style: string, property: string): number {
  const regex = new RegExp(`${property}\\s*:\\s*([\\d.]+)`, 'i');
  const match = style.match(regex);
  return match ? parseFloat(match[1]) : 0;
}

function extractNumberValue(style: string, property: string): number {
  const regex = new RegExp(`${property}\\s*:\\s*([\\d.]+)`, 'i');
  const match = style.match(regex);
  return match ? parseFloat(match[1]) : 12;
}

function rewriteCssUrls(css: string, basePath: string, assets: Map<string, ArchiveAsset>): string {
  return css.replace(/url\((['"]?)([^'"()]+)\1\)/gi, (_, quote: string, url: string) => {
    const trimmedUrl = url.trim();
    if (!trimmedUrl || /^([a-z]+:|data:|#|\/\/)/i.test(trimmedUrl)) {
      return `url(${quote}${trimmedUrl}${quote})`;
    }

    const resolvedPath = resolveRelativePath(basePath, trimmedUrl);
    const asset = assets.get(resolvedPath);
    return asset ? `url(${quote}${asset.dataUrl}${quote})` : `url(${quote}${trimmedUrl}${quote})`;
  });
}

function extractHtmlRefs(html: string): string[] {
  const refs = new Set<string>();
  const regex = /(?:src|href)=['"]([^'"]+\.html?)['"]/gi;
  let match = regex.exec(html);
  while (match) {
    refs.add(match[1]);
    match = regex.exec(html);
  }
  return Array.from(refs);
}

function extractPageNumber(path: string): number | null {
  const fileName = normalizePath(path).split('/').pop() || path;
  const nameWithoutExt = fileName.replace(/\.\w+$/, '');
  const match = nameWithoutExt.match(/(\d+)$/);
  if (match) return Number.parseInt(match[1], 10);
  return null;
}

function sortPagePaths(paths: string[]): string[] {
  return [...paths].sort((a, b) => {
    const aNumber = extractPageNumber(a);
    const bNumber = extractPageNumber(b);
    if (aNumber !== null && bNumber !== null && aNumber !== bNumber) return aNumber - bNumber;
    if (aNumber !== null && bNumber === null) return -1;
    if (aNumber === null && bNumber !== null) return 1;
    return a.localeCompare(b, undefined, { numeric: true, sensitivity: 'base' });
  });
}

function getPageCandidates(htmlFiles: Map<string, string>): string[] {
  const htmlPaths = Array.from(htmlFiles.keys());
  const numberedPaths = htmlPaths.filter((path) => extractPageNumber(path) !== null);
  if (numberedPaths.length > 0) return sortPagePaths(numberedPaths);

  const referencedPages = new Set<string>();
  htmlFiles.forEach((content, path) => {
    extractHtmlRefs(content).forEach((ref) => {
      const resolvedPath = resolveRelativePath(path, ref);
      if (htmlFiles.has(resolvedPath)) referencedPages.add(resolvedPath);
    });
  });

  if (referencedPages.size > 0) return sortPagePaths(Array.from(referencedPages));
  return sortPagePaths(htmlPaths);
}

function extractPlainText(doc: Document): string {
  const rawText = doc.body?.textContent || doc.documentElement.textContent || '';
  return rawText.replace(/\s+/g, ' ').trim();
}

function escapeHtml(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

type SemanticLine = {
  text: string;
  top: number;
  fontSize: number;
  isBold: boolean;
};

type SemanticBlock = {
  text: string;
  maxFontSize: number;
  isBold: boolean;
  isHeading: boolean;
};

function joinSemanticTokens(tokens: string[]): string {
  return tokens
    .join(' ')
    .replace(/\s+([,.;:!?%])/g, '$1')
    .replace(/([([{])\s+/g, '$1')
    .replace(/\s+([)\]}])/g, '$1')
    .replace(/\s+\/\s+/g, '/')
    .replace(/\s{2,}/g, ' ')
    .trim();
}

function buildSemanticBlocks(textElements: TextElement[]): SemanticBlock[] {
  const usable = textElements
    .filter((item) => item.text.trim().length > 0)
    .sort((a, b) => {
      if (Math.abs(a.top - b.top) > 6) return a.top - b.top;
      return a.left - b.left;
    });

  if (usable.length === 0) return [];

  const lines: SemanticLine[] = [];
  let currentLineItems: TextElement[] = [];
  let currentTop = usable[0].top;

  const flushLine = () => {
    if (currentLineItems.length === 0) return;
    const sorted = [...currentLineItems].sort((a, b) => a.left - b.left);
    const text = joinSemanticTokens(sorted.map((item) => item.text.trim()).filter(Boolean));
    if (!text) {
      currentLineItems = [];
      return;
    }

    const fontSize = sorted.reduce((max, item) => Math.max(max, item.fontSize || 0), 0) || 12;
    const isBold = sorted.some((item) => {
      const weight = item.fontWeight?.toLowerCase() || '';
      const numeric = Number.parseInt(weight, 10);
      return weight === 'bold' || (!Number.isNaN(numeric) && numeric >= 600);
    });

    lines.push({
      text,
      top: currentTop,
      fontSize,
      isBold,
    });

    currentLineItems = [];
  };

  usable.forEach((item) => {
    if (currentLineItems.length === 0) {
      currentLineItems.push(item);
      currentTop = item.top;
      return;
    }

    if (Math.abs(item.top - currentTop) <= 6) {
      currentLineItems.push(item);
      return;
    }

    flushLine();
    currentLineItems.push(item);
    currentTop = item.top;
  });

  flushLine();

  if (lines.length === 0) return [];

  const sortedFontSizes = usable.map((item) => item.fontSize || 12).sort((a, b) => a - b);
  const bodyFontSize = sortedFontSizes[Math.floor(sortedFontSizes.length / 2)] || 12;

  const blocks: SemanticBlock[] = [];
  let currentBlockLines: SemanticLine[] = [];

  const flushBlock = () => {
    if (currentBlockLines.length === 0) return;
    const text = joinSemanticTokens(currentBlockLines.map((line) => line.text));
    if (!text) {
      currentBlockLines = [];
      return;
    }

    const maxFontSize = currentBlockLines.reduce((max, line) => Math.max(max, line.fontSize), 0);
    const isBold = currentBlockLines.some((line) => line.isBold);
    const wordCount = text.split(/\s+/).filter(Boolean).length;
    const isHeading = wordCount <= 12 && (maxFontSize >= bodyFontSize * 1.2 || isBold);

    blocks.push({
      text,
      maxFontSize,
      isBold,
      isHeading,
    });

    currentBlockLines = [];
  };

  lines.forEach((line, index) => {
    if (currentBlockLines.length === 0) {
      currentBlockLines.push(line);
      return;
    }

    const previous = lines[index - 1];
    const gap = line.top - previous.top;
    const blockBreakThreshold = Math.max(previous.fontSize * 1.8, 22);
    const isNewBlock = gap > blockBreakThreshold;

    if (isNewBlock) {
      flushBlock();
    }

    currentBlockLines.push(line);
  });

  flushBlock();
  return blocks;
}

function buildSemanticLayerHtml(textElements: TextElement[]): string {
  const blocks = buildSemanticBlocks(textElements);
  if (blocks.length === 0) return '';

  const content = blocks
    .map((block) => {
      const tag = block.isHeading ? 'h2' : 'p';
      return `<${tag}>${escapeHtml(block.text)}</${tag}>`;
    })
    .join('');

  return `
    <style data-semantic-layer-style>
      .semantic-text-layer {
        position: absolute !important;
        width: 1px !important;
        height: 1px !important;
        padding: 0 !important;
        margin: -1px !important;
        overflow: hidden !important;
        clip: rect(0, 0, 0, 0) !important;
        clip-path: inset(50%) !important;
        white-space: normal !important;
        border: 0 !important;
      }
      .semantic-text-layer h1,
      .semantic-text-layer h2,
      .semantic-text-layer h3,
      .semantic-text-layer p {
        margin: 0 0 0.75rem 0 !important;
      }
    </style>
    <article class="semantic-text-layer" data-semantic-layer="true">${content}</article>
  `;
}

function normalizePageHtml(doc: Document, textElements: TextElement[]): string {
  const clonedDoc = doc.cloneNode(true) as Document;
  if (!clonedDoc.body) return serializeDocument(doc);

  const spanGroupsByParent = new Map<HTMLElement, HTMLElement[]>();
  const allTextSpans = Array.from(clonedDoc.querySelectorAll('span')) as HTMLElement[];

  allTextSpans.forEach((span) => {
    const text = span.textContent?.replace(/\s+/g, ' ').trim() || '';
    if (!text) return;

    const parent = span.parentElement;
    if (!parent) return;

    const group = spanGroupsByParent.get(parent) || [];
    group.push(span);
    spanGroupsByParent.set(parent, group);
  });

  const estimateSpanBox = (span: HTMLElement) => {
    const style = span.getAttribute('style') || '';
    const left = extractPositionValue(style, 'left');
    const top = extractPositionValue(style, 'top');
    const fontSize = extractNumberValue(style, 'font-size');
    const width = extractNumberValue(style, 'width') || Math.max(fontSize * ((span.textContent?.trim().length || 1) * 0.58), fontSize);
    const height = extractNumberValue(style, 'height') || Math.max(fontSize * 1.35, 12);
    return { left, top, width, height, fontSize };
  };

  spanGroupsByParent.forEach((spans, parent) => {
    if (spans.length < 2) return;

    const sorted = [...spans].sort((a, b) => {
      const boxA = estimateSpanBox(a);
      const boxB = estimateSpanBox(b);
      if (Math.abs(boxA.top - boxB.top) > 6) return boxA.top - boxB.top;
      return boxA.left - boxB.left;
    });

    const lines: HTMLElement[][] = [];
    let currentLine: HTMLElement[] = [];
    let currentTop = -Infinity;

    sorted.forEach((span) => {
      const { top } = estimateSpanBox(span);
      if (currentLine.length === 0) {
        currentLine.push(span);
        currentTop = top;
        return;
      }

      if (Math.abs(top - currentTop) <= 6) {
        currentLine.push(span);
        return;
      }

      lines.push(currentLine);
      currentLine = [span];
      currentTop = top;
    });

    if (currentLine.length > 0) lines.push(currentLine);

    const blocks: HTMLElement[][] = [];
    let currentBlock: HTMLElement[] = [];
    let previousLineTop = -Infinity;
    let previousLineFontSize = 12;

    lines.forEach((line) => {
      const lineBoxes = line.map(estimateSpanBox);
      const lineTop = Math.min(...lineBoxes.map((box) => box.top));
      const lineFontSize = Math.max(...lineBoxes.map((box) => box.fontSize));
      const breakThreshold = Math.max(previousLineFontSize * 1.75, 22);

      if (currentBlock.length > 0 && lineTop - previousLineTop > breakThreshold) {
        blocks.push(currentBlock);
        currentBlock = [];
      }

      currentBlock.push(...line);
      previousLineTop = lineTop;
      previousLineFontSize = lineFontSize;
    });

    if (currentBlock.length > 0) blocks.push(currentBlock);

    blocks.forEach((block) => {
      if (block.length === 0) return;

      const blockBoxes = block.map(estimateSpanBox);
      const minLeft = Math.min(...blockBoxes.map((box) => box.left));
      const minTop = Math.min(...blockBoxes.map((box) => box.top));
      const maxRight = Math.max(...blockBoxes.map((box) => box.left + box.width));
      const maxBottom = Math.max(...blockBoxes.map((box) => box.top + box.height));
      const maxFontSize = Math.max(...blockBoxes.map((box) => box.fontSize));
      const text = joinSemanticTokens(block.map((span) => span.textContent?.trim() || '').filter(Boolean));
      if (!text) return;

      const isBold = block.some((span) => {
        const weight = (span.style.fontWeight || '').toLowerCase();
        const numeric = Number.parseInt(weight, 10);
        return weight === 'bold' || (!Number.isNaN(numeric) && numeric >= 600);
      });
      const wordCount = text.split(/\s+/).filter(Boolean).length;
      const tagName = wordCount <= 12 && (isBold || maxFontSize >= 18) ? 'h2' : 'p';

      const wrapper = clonedDoc.createElement(tagName);
      wrapper.setAttribute('data-semantic-text', text);
      wrapper.setAttribute(
        'style',
        [
          'position:absolute',
          `left:${minLeft}px`,
          `top:${minTop}px`,
          `width:${Math.max(maxRight - minLeft, 1)}px`,
          `height:${Math.max(maxBottom - minTop, maxFontSize)}px`,
          'margin:0',
          'padding:0',
          'background:transparent',
          'border:0',
          'pointer-events:auto',
          'user-select:text',
        ].join(';'),
      );

      const first = block[0];
      parent.insertBefore(wrapper, first);

      block.forEach((span) => {
        const style = span.getAttribute('style') || '';
        const box = estimateSpanBox(span);
        const adjustedStyle = style
          .replace(/left\s*:\s*[\d.]+/i, `left:${Math.max(box.left - minLeft, 0)}`)
          .replace(/top\s*:\s*[\d.]+/i, `top:${Math.max(box.top - minTop, 0)}`);

        span.setAttribute('style', `${adjustedStyle}; pointer-events:auto; user-select:text; -webkit-user-select:text;`);
        wrapper.appendChild(span);
      });
    });
  });

  const semanticLayerHtml = buildSemanticLayerHtml(textElements);
  if (semanticLayerHtml) {
    clonedDoc.body.insertAdjacentHTML('beforeend', semanticLayerHtml);
  }

  return serializeDocument(clonedDoc);
}

function getPageTitle(doc: Document, pageNumber: number, plainText: string): string {
  const titleCandidates = [
    doc.title,
    doc.querySelector('h1, h2, [data-title], title')?.textContent || '',
    plainText,
  ].map((value) => value.trim()).filter(Boolean);
  return (titleCandidates[0] || `Page ${pageNumber}`).slice(0, 80);
}

function detectPageDimensions(doc: Document, textElements: TextElement[], images: ImageElement[]) {
  const candidates: Array<{ width: number; height: number }> = [];
  ['#container', '#page', '#_idContainer000', 'body > div', 'body'].forEach((selector) => {
    const element = doc.querySelector(selector) as HTMLElement | null;
    if (!element) return;
    const style = element.getAttribute('style') || '';
    const width = extractNumberValue(style, 'width');
    const height = extractNumberValue(style, 'height');
    if (width > 100 && height > 100) candidates.push({ width, height });
  });

  if (candidates.length > 0) return candidates[0];

  const maxTextWidth = textElements.reduce((max, item) => Math.max(max, item.left + 400), 0);
  const maxTextHeight = textElements.reduce((max, item) => Math.max(max, item.top + item.fontSize * 2), 0);
  const maxImageWidth = images.reduce((max, item) => Math.max(max, (item.left || 0) + 600), 0);
  const maxImageHeight = images.reduce((max, item) => Math.max(max, (item.top || 0) + 400), 0);

  return {
    width: Math.max(900, Math.ceil(Math.max(maxTextWidth, maxImageWidth))),
    height: Math.max(1200, Math.ceil(Math.max(maxTextHeight, maxImageHeight))),
  };
}

function inlineDocumentAssets(doc: Document, pagePath: string, assets: Map<string, ArchiveAsset>) {
  doc.querySelectorAll('link[rel="stylesheet"][href]').forEach((node) => {
    const href = node.getAttribute('href');
    if (!href) return;
    const asset = assets.get(resolveRelativePath(pagePath, href));
    if (!asset?.text) return;

    const style = doc.createElement('style');
    style.setAttribute('data-inline-href', href);
    style.textContent = rewriteCssUrls(asset.text, resolveRelativePath(pagePath, href), assets);
    node.replaceWith(style);
  });

  doc.querySelectorAll('script[src]').forEach((node) => {
    const src = node.getAttribute('src');
    if (!src) return;
    const asset = assets.get(resolveRelativePath(pagePath, src));
    if (!asset?.text) return;

    const script = doc.createElement('script');
    script.textContent = asset.text;
    node.replaceWith(script);
  });

  doc.querySelectorAll('style').forEach((node) => {
    node.textContent = rewriteCssUrls(node.textContent || '', pagePath, assets);
  });

  doc.querySelectorAll<HTMLElement>('[style]').forEach((node) => {
    const style = node.getAttribute('style');
    if (!style) return;
    node.setAttribute('style', rewriteCssUrls(style, pagePath, assets));
  });

  doc.querySelectorAll<HTMLElement>('[src]').forEach((node) => {
    const src = node.getAttribute('src');
    if (!src) return;
    const asset = assets.get(resolveRelativePath(pagePath, src));
    if (asset) node.setAttribute('src', asset.dataUrl);
  });

  doc.querySelectorAll<HTMLElement>('[href]').forEach((node) => {
    if (node.tagName.toLowerCase() === 'a') return;
    const href = node.getAttribute('href');
    if (!href) return;
    const asset = assets.get(resolveRelativePath(pagePath, href));
    if (asset) node.setAttribute('href', asset.dataUrl);
  });
}

function serializeDocument(doc: Document): string {
  const doctype = doc.doctype
    ? `<!DOCTYPE ${doc.doctype.name}${doc.doctype.publicId ? ` PUBLIC \"${doc.doctype.publicId}\"` : ''}${doc.doctype.systemId ? ` \"${doc.doctype.systemId}\"` : ''}>`
    : '<!DOCTYPE html>';
  return `${doctype}\n${doc.documentElement.outerHTML}`;
}

function buildCombinedHtml(sourceName: string, pages: ParsedHtmlCatalogPage[]): string {
  const escapedTitle = sourceName.replace(/[&<>"']/g, (char) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[char] || char));
  const sections = pages.map((page) => {
    const escapedPageHtml = page.html.replace(/&/g, '&amp;').replace(/"/g, '&quot;');
    return `\n    <section data-page-number="${page.pageNumber}" data-page-title="${page.title.replace(/&/g, '&amp;').replace(/"/g, '&quot;')}" style="page-break-after: always; break-after: page; margin: 0 auto 24px; width: ${page.width}px;">\n      <iframe title="${page.title.replace(/&/g, '&amp;').replace(/"/g, '&quot;')}" srcdoc="${escapedPageHtml}" style="width:${page.width}px;height:${page.height}px;border:0;display:block;background:#fff;"></iframe>\n    </section>`;
  }).join('\n');

  return `<!DOCTYPE html>\n<html lang="en">\n  <head>\n    <meta charset="utf-8" />\n    <meta name="viewport" content="width=device-width, initial-scale=1" />\n    <title>${escapedTitle}</title>\n    <style>body { margin: 0; padding: 24px; background: #f5f5f5; } section:last-child { break-after: auto; page-break-after: auto; }</style>\n  </head>\n  <body>${sections}\n  </body>\n</html>`;
}

function parseBundledHtmlPage(htmlContent: string, pageNumber: number, pagePath: string, assets: Map<string, ArchiveAsset>): ParsedHtmlCatalogPage {
  if (typeof DOMParser === 'undefined') throw new Error('HTML parsing is only available in the browser.');

  const parser = new DOMParser();
  const rawDoc = parser.parseFromString(htmlContent, 'text/html');
  const doc = parser.parseFromString(htmlContent, 'text/html');

  const textElements: TextElement[] = [];
  rawDoc.querySelectorAll('span, p, h1, h2, h3, h4, h5, h6, li, div').forEach((node: Element) => {
    const text = node.textContent?.trim() || '';
    if (!text) return;
    const style = node.getAttribute('style') || '';
    textElements.push({
      text,
      top: extractPositionValue(style, 'top'),
      left: extractPositionValue(style, 'left'),
      fontSize: extractNumberValue(style, 'font-size'),
      fontWeight: (node as HTMLElement).style.fontWeight || 'normal',
    });
  });

  const images: ImageElement[] = [];
  rawDoc.querySelectorAll('img').forEach((img: Element, index: number) => {
    const style = img.getAttribute('style') || '';
    images.push({
      id: `page${pageNumber}-img${index}`,
      src: img.getAttribute('src') || '',
      alt: img.getAttribute('alt') || `Image ${index + 1}`,
      top: extractPositionValue(style, 'top'),
      left: extractPositionValue(style, 'left'),
    });
  });

  inlineDocumentAssets(doc, pagePath, assets);

  const plainText = extractPlainText(rawDoc);
  const title = getPageTitle(rawDoc, pageNumber, plainText);
  const { width, height } = detectPageDimensions(rawDoc, textElements, images);

  // Normalize text while preserving all design/layout/images
  const normalizedHtml = normalizePageHtml(doc, textElements);

  return {
    pageNumber,
    title,
    textElements,
    images,
    rawHtml: htmlContent,
    html: normalizedHtml,
    plainText,
    width,
    height,
    filePath: pagePath,
  };
}

async function buildZipAssetMaps(file: File) {
  const zip = await JSZip.loadAsync(await file.arrayBuffer());
  const htmlFiles = new Map<string, string>();
  const assets = new Map<string, ArchiveAsset>();

  for (const [originalPath, zipEntry] of Object.entries(zip.files) as [string, JSZip.JSZipObject][]) {
    if (zipEntry.dir) continue;
    const path = normalizePath(originalPath);
    const mimeType = getMimeType(path);
    const extension = getFileExtension(path);

    if (extension === '.html' || extension === '.htm') {
      const text = await zipEntry.async('text');
      htmlFiles.set(path, text);
      assets.set(path, { path, mimeType, text, dataUrl: textToDataUrl(text, mimeType) });
      continue;
    }

    if (mimeType.startsWith('text/') || mimeType === 'application/json' || mimeType === 'text/javascript') {
      const text = await zipEntry.async('text');
      assets.set(path, { path, mimeType, text, dataUrl: textToDataUrl(text, mimeType) });
      continue;
    }

    const bytes = await zipEntry.async('uint8array');
    assets.set(path, { path, mimeType, dataUrl: binaryToDataUrl(bytes, mimeType) });
  }

  return { htmlFiles, assets };
}

async function parseStandaloneHtmlFile(file: File): Promise<ParsedHtmlCatalog> {
  const htmlContent = await file.text();
  const page = parseBundledHtmlPage(htmlContent, 1, normalizePath(file.name), new Map());
  return { sourceName: file.name, pages: [page], totalPages: 1, combinedHtml: buildCombinedHtml(file.name, [page]) };
}

export async function parseHtmlCatalogUpload(file: File): Promise<ParsedHtmlCatalog> {
  const extension = getFileExtension(file.name);
  if (extension === '.html' || extension === '.htm') return parseStandaloneHtmlFile(file);
  if (extension !== '.zip') throw new Error('Upload a ZIP of the HTML export or a standalone HTML file.');

  const { htmlFiles, assets } = await buildZipAssetMaps(file);
  if (htmlFiles.size === 0) throw new Error('No HTML files were found in the uploaded archive.');

  const pagePaths = getPageCandidates(htmlFiles);
  if (pagePaths.length === 0) throw new Error('No page HTML files were found in the uploaded archive.');

  const pages = pagePaths.map((pagePath, index) => {
    const htmlContent = htmlFiles.get(pagePath);
    if (!htmlContent) throw new Error(`Missing HTML content for ${pagePath}.`);
    return parseBundledHtmlPage(htmlContent, index + 1, pagePath, assets);
  });

  return { sourceName: file.name, pages, totalPages: pages.length, combinedHtml: buildCombinedHtml(file.name, pages) };
}

export function extractSemanticText(page: ParsedHtmlCatalogPage): string {
  if (page.plainText) return page.plainText;

  const sorted = [...page.textElements].sort((a, b) => {
    const yThreshold = 8;
    if (Math.abs(a.top - b.top) > yThreshold) return a.top - b.top;
    return a.left - b.left;
  });

  const lines: string[] = [];
  let currentLine = '';
  let lastTop = -Infinity;

  sorted.forEach((element) => {
    const yThreshold = 8;
    if (Math.abs(element.top - lastTop) > yThreshold) {
      if (currentLine.trim()) lines.push(currentLine.trim());
      currentLine = element.text;
      lastTop = element.top;
    } else {
      currentLine += ` ${element.text}`;
    }
  });

  if (currentLine.trim()) lines.push(currentLine.trim());
  return lines.join('\n').trim();
}
