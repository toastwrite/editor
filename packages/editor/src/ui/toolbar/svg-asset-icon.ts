const SVG_NS = 'http://www.w3.org/2000/svg';
const ICON_SIZE = 20;

const SOLID_ICON_COLORS = new Set([
  '#000',
  '#000000',
  'black',
  '#111',
  '#111111',
  '#222',
  '#222222',
  '#333',
  '#333333',
  '#444',
  '#444444',
]);

function isSolidIconColor(color: string | null): boolean {
  if (!color) {
    return false;
  }

  return SOLID_ICON_COLORS.has(color.trim().toLowerCase());
}

function normalizeSvgColors(svg: SVGSVGElement): void {
  svg.querySelectorAll('image').forEach((element) => {
    element.classList.add('toastwrite-editor-toolbar-icon-raster');
  });

  svg.querySelectorAll('path, rect, circle, ellipse, polygon, polyline, line, text').forEach((element) => {
    const fill = element.getAttribute('fill');
    if (fill && fill !== 'none' && fill !== 'currentColor' && isSolidIconColor(fill)) {
      element.setAttribute('fill', 'currentColor');
    }

    const stroke = element.getAttribute('stroke');
    if (stroke && stroke !== 'none' && stroke !== 'currentColor' && isSolidIconColor(stroke)) {
      element.setAttribute('stroke', 'currentColor');
    }
  });
}

export function createSvgFromAsset(rawSvg: string): SVGSVGElement {
  const doc = new DOMParser().parseFromString(rawSvg.trim(), 'image/svg+xml');
  const source = doc.documentElement;
  const svg = document.createElementNS(SVG_NS, 'svg');

  const viewBox = source.getAttribute('viewBox');
  if (viewBox) {
    svg.setAttribute('viewBox', viewBox);
  }

  svg.setAttribute('width', String(ICON_SIZE));
  svg.setAttribute('height', String(ICON_SIZE));
  svg.setAttribute('aria-hidden', 'true');
  svg.setAttribute('class', 'toastwrite-editor-toolbar-icon toastwrite-editor-toolbar-icon-svg');

  const fill = source.getAttribute('fill');
  if (fill !== null) {
    svg.setAttribute('fill', fill);
  }

  for (const child of Array.from(source.childNodes)) {
    svg.appendChild(child.cloneNode(true));
  }

  normalizeSvgColors(svg);

  return svg;
}
