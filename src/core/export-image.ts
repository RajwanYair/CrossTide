/**
 * Export to image — capture a DOM element as PNG or SVG.
 *
 * Uses the browser-native approach:
 *  - PNG: html2canvas-like technique via foreignObject in SVG → canvas → blob
 *  - SVG: Serialize the element as an SVG foreignObject for vector export
 *
 * Falls back gracefully if APIs are unavailable (e.g. test environment).
 */

/**
 * Capture an HTML element as a PNG Blob.
 *
 * Technique: Render the element's outerHTML inside an SVG foreignObject,
 * draw that SVG onto a canvas, then export as PNG blob.
 */
export async function captureElementAsPng(
  element: HTMLElement,
  options: { scale?: number } = {},
): Promise<Blob | null> {
  const { scale = 2 } = options;
  const width = element.offsetWidth;
  const height = element.offsetHeight;

  if (width === 0 || height === 0) return null;

  // Clone the element with computed styles inlined
  const clone = element.cloneNode(true) as HTMLElement;
  inlineComputedStyles(element, clone);

  const svgNs = "http://www.w3.org/2000/svg";
  const svgMarkup = `<svg xmlns="${svgNs}" width="${width}" height="${height}">
    <foreignObject width="100%" height="100%">
      <div xmlns="http://www.w3.org/1999/xhtml">${clone.outerHTML}</div>
    </foreignObject>
  </svg>`;

  const svgBlob = new Blob([svgMarkup], { type: "image/svg+xml;charset=utf-8" });
  const url = URL.createObjectURL(svgBlob);

  try {
    const img = await loadImage(url, width * scale, height * scale);
    const canvas = document.createElement("canvas");
    canvas.width = width * scale;
    canvas.height = height * scale;
    const ctx = canvas.getContext("2d");
    if (!ctx) return null;

    ctx.scale(scale, scale);
    ctx.drawImage(img, 0, 0);

    return await new Promise<Blob | null>((resolve) => {
      canvas.toBlob((blob) => resolve(blob), "image/png");
    });
  } finally {
    URL.revokeObjectURL(url);
  }
}

/**
 * Export an HTML element as an SVG string (foreignObject wrapper).
 */
export function captureElementAsSvg(element: HTMLElement): string {
  const width = element.offsetWidth;
  const height = element.offsetHeight;

  const clone = element.cloneNode(true) as HTMLElement;
  inlineComputedStyles(element, clone);

  const svgNs = "http://www.w3.org/2000/svg";
  return `<svg xmlns="${svgNs}" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}">
    <foreignObject width="100%" height="100%">
      <div xmlns="http://www.w3.org/1999/xhtml">${clone.outerHTML}</div>
    </foreignObject>
  </svg>`;
}

/**
 * Download a blob as a file via a temporary anchor.
 */
export function downloadBlob(blob: Blob, filename: string): void {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.style.display = "none";
  document.body.appendChild(a);
  a.click();
  // Cleanup after the browser processes the download
  setTimeout(() => {
    URL.revokeObjectURL(url);
    a.remove();
  }, 100);
}

/**
 * Download an SVG string as a file.
 */
export function downloadSvg(svgContent: string, filename: string): void {
  const blob = new Blob([svgContent], { type: "image/svg+xml;charset=utf-8" });
  downloadBlob(blob, filename);
}

// ── Internal helpers ─────────────────────────────────────────────────────────

function loadImage(url: string, _w: number, _h: number): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = (): void => resolve(img);
    img.onerror = (): void => reject(new Error("Failed to load SVG image for export"));
    img.src = url;
  });
}

/**
 * Recursively inline computed styles from source element to clone.
 * This ensures the exported image captures the visual appearance.
 */
function inlineComputedStyles(source: Element, clone: Element): void {
  if (!(source instanceof HTMLElement) || !(clone instanceof HTMLElement)) return;

  const computed = getComputedStyle(source);
  const importantProps = [
    "color",
    "background-color",
    "background",
    "font-family",
    "font-size",
    "font-weight",
    "line-height",
    "padding",
    "margin",
    "border",
    "border-radius",
    "display",
    "flex-direction",
    "align-items",
    "justify-content",
    "gap",
    "width",
    "height",
    "max-width",
    "overflow",
    "text-align",
    "opacity",
    "box-shadow",
  ];

  for (const prop of importantProps) {
    const value = computed.getPropertyValue(prop);
    if (value) {
      clone.style.setProperty(prop, value);
    }
  }

  const sourceChildren = source.children;
  const cloneChildren = clone.children;
  const len = Math.min(sourceChildren.length, cloneChildren.length);
  for (let i = 0; i < len; i++) {
    inlineComputedStyles(sourceChildren[i]!, cloneChildren[i]!);
  }
}
