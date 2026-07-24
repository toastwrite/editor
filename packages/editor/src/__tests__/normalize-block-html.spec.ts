import { describe, expect, it } from 'vitest';
import { Renderer, ToastMark } from '@toastwrite/parser';
import {
  hasEmbeddedBlockHtml,
  normalizeMarkdownForPreview,
} from '../markdown/normalize-block-html.js';

const SAMPLE = `<i>Note :This is mock output.</i></br> tests<p>Please review investigation summary</p><hr>{% for summary in vars.steps.Hunt_Indicators | sort(attribute='indicator_type') %}{{summary.analysis_summary}}</br>{% endfor %}<hr>Do you want to block indicators?`;

describe('normalizeBlockHtml', () => {
  it('detects embedded block-level html in a line', () => {
    expect(hasEmbeddedBlockHtml(SAMPLE)).toBe(true);
    expect(hasEmbeddedBlockHtml('# Hello **world**')).toBe(false);
  });

  it('splits embedded block html onto separate lines', () => {
    const normalized = normalizeMarkdownForPreview(SAMPLE);
    const lines = normalized.split('\n');

    expect(lines.length).toBeGreaterThan(1);
    expect(lines.some((line) => /^<p(?:\s|>)/.test(line.trimStart()))).toBe(true);
    expect(lines.some((line) => /^<hr(?:\s|\/?>)/i.test(line.trimStart()))).toBe(true);
    expect(lines[0]).toContain('<i>Note :This is mock output.</i>');
  });

  it('renders normalized html with data-nodeid on every top-level preview node', () => {
    const normalized = normalizeMarkdownForPreview(SAMPLE);
    const toastMark = new ToastMark(normalized);
    const preview = new Renderer({ gfm: true, nodeId: true }).render(toastMark.getRootNode());
    const container = document.createElement('div');
    container.innerHTML = preview;

    const children = Array.from(container.children);
    expect(children.length).toBeGreaterThan(0);
    expect(children.every((child) => child.hasAttribute('data-nodeid'))).toBe(true);
  });
});
