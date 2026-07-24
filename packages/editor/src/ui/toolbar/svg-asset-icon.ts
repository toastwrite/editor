const SVG_NS = 'http://www.w3.org/2000/svg';
const ICON_SIZE = 20;

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

  return svg;
}
