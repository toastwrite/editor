import { Parser } from '../blocks';

describe('blockQuote', () => {
  it('parses blockquote lines without a space after the marker', () => {
    const reader = new Parser();
    const root = reader.parse('>hello');

    expect(root).toMatchObject({
      type: 'document',
      firstChild: {
        type: 'blockQuote',
        firstChild: {
          type: 'paragraph',
          firstChild: {
            type: 'text',
            literal: 'hello',
          },
        },
      },
    });
  });

  it('parses blockquote lines with a space after the marker', () => {
    const reader = new Parser();
    const root = reader.parse('> hello');

    expect(root).toMatchObject({
      type: 'document',
      firstChild: {
        type: 'blockQuote',
        firstChild: {
          type: 'paragraph',
          firstChild: {
            type: 'text',
            literal: 'hello',
          },
        },
      },
    });
  });
});
