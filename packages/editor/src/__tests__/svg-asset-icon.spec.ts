import { describe, expect, it } from 'vitest';
import { createSvgFromAsset } from '../ui/toolbar/svg-asset-icon.js';

describe('svg asset icons', () => {
  it('uses svg file content as-is with only toolbar sizing applied', () => {
    const icon = createSvgFromAsset(
      '<svg viewBox="0 0 24 24"><path d="M0 0h24v24H0z" fill="#000000"/></svg>'
    );

    expect(icon.getAttribute('viewBox')).toBe('0 0 24 24');
    expect(icon.getAttribute('width')).toBe('20');
    expect(icon.getAttribute('height')).toBe('20');
    expect(icon.querySelector('path')?.getAttribute('fill')).toBe('#000000');
    expect(icon.querySelector('g[transform]')).toBeFalsy();
  });

  it('preserves fill="none" from the source svg root', () => {
    const icon = createSvgFromAsset(
      '<svg viewBox="0 0 24 24" fill="none"><rect x="4" y="4" width="16" height="16" stroke="currentColor"/></svg>'
    );

    expect(icon.getAttribute('fill')).toBe('none');
    expect(icon.querySelector('rect')?.getAttribute('fill')).toBeNull();
  });
});
