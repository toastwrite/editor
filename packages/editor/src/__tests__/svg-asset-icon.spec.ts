import { describe, expect, it } from 'vitest';
import { createSvgFromAsset } from '../ui/toolbar/svg-asset-icon.js';

describe('svg asset icons', () => {
  it('uses svg file content with toolbar sizing and currentColor normalization', () => {
    const icon = createSvgFromAsset(
      '<svg viewBox="0 0 24 24"><path d="M0 0h24v24H0z" fill="#000000"/></svg>'
    );

    expect(icon.getAttribute('viewBox')).toBe('0 0 24 24');
    expect(icon.getAttribute('width')).toBe('20');
    expect(icon.getAttribute('height')).toBe('20');
    expect(icon.querySelector('path')?.getAttribute('fill')).toBe('currentColor');
    expect(icon.querySelector('g[transform]')).toBeFalsy();
  });

  it('preserves fill="none" from the source svg root', () => {
    const icon = createSvgFromAsset(
      '<svg viewBox="0 0 24 24" fill="none"><rect x="4" y="4" width="16" height="16" stroke="currentColor"/></svg>'
    );

    expect(icon.getAttribute('fill')).toBe('none');
    expect(icon.querySelector('rect')?.getAttribute('fill')).toBeNull();
  });

  it('marks embedded raster images for css tinting', () => {
    const icon = createSvgFromAsset(
      '<svg viewBox="0 0 24 24"><image width="24" height="24" href="data:image/png;base64,abc"/></svg>'
    );

    expect(icon.querySelector('image')?.classList.contains('toastwrite-editor-toolbar-icon-raster')).toBe(
      true
    );
  });
});
