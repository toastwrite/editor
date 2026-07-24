import { source } from 'common-tags';
import { Parser } from '../../blocks';
import { Renderer } from '../../../html/renderer';
import { BlockQuoteNode } from '../../node';

const reader = new Parser();
const renderer = new Renderer({ gfm: true });
const plainRenderer = new Renderer({ gfm: false });

describe('GFM alerts', () => {
  it('parses a standard note alert and strips the marker paragraph', () => {
    const root = reader.parse(source`
      > [!NOTE]
      > Useful information that users should know, even when skimming content.
    `);

    const blockQuote = root.firstChild as BlockQuoteNode;
    expect(blockQuote.alertData).toEqual({
      type: 'NOTE',
      title: null,
    });
    expect(blockQuote.firstChild).toMatchObject({
      type: 'paragraph',
      firstChild: {
        type: 'text',
        literal: 'Useful information that users should know, even when skimming content.',
      },
    });
  });

  it('parses a custom title in parentheses', () => {
    const root = reader.parse(source`
      > [!NOTE](Some text)
      > Useful information that users should know, even when skimming content.
    `);

    expect((root.firstChild as BlockQuoteNode).alertData).toEqual({
      type: 'NOTE',
      title: 'Some text',
    });
  });

  it('parses an empty title in parentheses', () => {
    const root = reader.parse(source`
      > [!NOTE]()
      > Useful information that users should know, even when skimming content.
    `);

    expect((root.firstChild as BlockQuoteNode).alertData).toEqual({
      type: 'NOTE',
      title: '',
    });
  });

  it('parses a custom title after the marker with a space', () => {
    const root = reader.parse(source`
      > [!WARNING] Breaking Changes
      > This version introduces significant updates.
    `);

    expect((root.firstChild as BlockQuoteNode).alertData).toEqual({
      type: 'WARNING',
      title: 'Breaking Changes',
    });
  });

  it('leaves regular blockquotes unchanged', () => {
    const root = reader.parse('> Regular quote');

    expect((root.firstChild as BlockQuoteNode).alertData).toBeNull();
  });

  it('renders alerts with default titles when gfm is enabled', () => {
    const input = source`
      > [!NOTE]
      > Useful information that users should know, even when skimming content.
    `;

    const html = renderer.render(reader.parse(input));

    expect(html).toContain('class="markdown-alert markdown-alert-note"');
    expect(html).toContain('class="markdown-alert-title"');
    expect(html).toContain('Note');
    expect(html).toContain('Useful information that users should know, even when skimming content.');
    expect(html).not.toContain('[!NOTE]');
  });

  it('renders a custom title from parentheses', () => {
    const input = source`
      > [!NOTE](Some text)
      > Useful information that users should know, even when skimming content.
    `;

    const html = renderer.render(reader.parse(input));

    expect(html).toContain('Some text');
    expect(html).not.toContain('>Note<');
    expect(html).not.toContain('[!NOTE]');
  });

  it('omits the title when parentheses are empty', () => {
    const input = source`
      > [!NOTE]()
      > Useful information that users should know, even when skimming content.
    `;

    const html = renderer.render(reader.parse(input));

    expect(html).toContain('class="markdown-alert markdown-alert-note"');
    expect(html).not.toContain('markdown-alert-title');
    expect(html).toContain('Useful information that users should know, even when skimming content.');
  });

  it('renders all five standard alert types', () => {
    const input = source`
      > [!NOTE]
      > Note body

      > [!TIP]
      > Tip body

      > [!IMPORTANT]
      > Important body

      > [!WARNING]
      > Warning body

      > [!CAUTION]
      > Caution body
    `;

    const html = renderer.render(reader.parse(input));

    expect(html).toContain('markdown-alert-note');
    expect(html).toContain('markdown-alert-tip');
    expect(html).toContain('markdown-alert-important');
    expect(html).toContain('markdown-alert-warning');
    expect(html).toContain('markdown-alert-caution');
    expect(html).toContain('Tip');
    expect(html).toContain('Important');
    expect(html).toContain('Warning');
    expect(html).toContain('Caution');
  });

  it('falls back to blockquote rendering when gfm is disabled', () => {
    const input = source`
      > [!NOTE]
      > Useful information
    `;

    const html = plainRenderer.render(reader.parse(input));

    expect(html).toContain('<blockquote>');
    expect(html).not.toContain('markdown-alert');
  });
});
