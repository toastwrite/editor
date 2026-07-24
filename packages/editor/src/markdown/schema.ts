import { Schema } from 'prosemirror-model';
import { mdClass } from './md-class.js';

function markToDOM(classNames: string) {
  return ['span', { class: mdClass(...classNames.split('|')) }, 0] as const;
}

export const markdownLineSchema = new Schema({
  nodes: {
    doc: { content: 'paragraph+' },
    paragraph: {
      content: 'text*',
      group: 'block',
      attrs: {
        lineBackground: { default: null },
      },
      parseDOM: [
        {
          tag: 'p',
          getAttrs(dom) {
            const element = dom as HTMLElement;
            return {
              lineBackground: element.getAttribute('data-line-background'),
            };
          },
        },
      ],
      toDOM(node) {
        const { lineBackground } = node.attrs;
        if (!lineBackground) {
          return ['p', 0];
        }

        const classes = lineBackground
          .split(' ')
          .map((part: string) => `toastwrite-editor-md-${part}`)
          .join(' ');

        return ['p', { class: classes }, 0];
      },
    },
    text: { group: 'inline' },
  },
  marks: {
    link: {
      attrs: {
        url: { default: false },
        desc: { default: false },
      },
      toDOM(mark) {
        const { url, desc } = mark.attrs;
        let classNames = 'link';

        if (url) {
          classNames += '|link-url|marked-text';
        }
        if (desc) {
          classNames += '|link-desc|marked-text';
        }

        return markToDOM(classNames);
      },
    },
    code: {
      attrs: {
        start: { default: false },
        end: { default: false },
        marked: { default: false },
      },
      toDOM(mark) {
        const { start, end, marked } = mark.attrs;
        let classNames = 'code';

        if (start) {
          classNames += '|delimiter|start';
        }
        if (end) {
          classNames += '|delimiter|end';
        }
        if (marked) {
          classNames += '|marked-text';
        }

        return markToDOM(classNames);
      },
    },
    codeBlock: {
      toDOM() {
        return markToDOM('code-block');
      },
    },
    listItem: {
      attrs: {
        odd: { default: false },
        even: { default: false },
        listStyle: { default: false },
      },
      toDOM(mark) {
        const { odd, even, listStyle } = mark.attrs;
        let classNames = 'list-item';

        if (listStyle) {
          classNames += '|list-item-style';
        }
        if (odd) {
          classNames += '|list-item-odd';
        }
        if (even) {
          classNames += '|list-item-even';
        }

        return markToDOM(classNames);
      },
    },
    delimiter: {
      toDOM() {
        return markToDOM('delimiter');
      },
    },
    markedText: {
      toDOM() {
        return markToDOM('marked-text');
      },
    },
    meta: {
      toDOM() {
        return markToDOM('meta');
      },
    },
    strong: {
      toDOM() {
        return markToDOM('strong');
      },
    },
    emph: {
      toDOM() {
        return markToDOM('emph');
      },
    },
    strike: {
      toDOM() {
        return markToDOM('strike');
      },
    },
    table: {
      toDOM() {
        return markToDOM('table');
      },
    },
    tableCell: {
      toDOM() {
        return markToDOM('table-cell');
      },
    },
    taskDelimiter: {
      toDOM() {
        return markToDOM('delimiter|list-item');
      },
    },
    blockquote: {
      attrs: {
        marker: { default: false },
      },
      toDOM(mark) {
        return markToDOM(mark.attrs.marker ? 'blockquote-marker' : 'blockquote');
      },
    },
    htmlTag: {
      toDOM() {
        return markToDOM('html-tag');
      },
    },
    htmlAttr: {
      toDOM() {
        return markToDOM('html-attr');
      },
    },
    htmlAttrValue: {
      toDOM() {
        return markToDOM('html-attr-value');
      },
    },
  },
});

export const SYNTAX_MARK_TYPES = [
  'link',
  'code',
  'codeBlock',
  'listItem',
  'delimiter',
  'markedText',
  'meta',
  'strong',
  'emph',
  'strike',
  'table',
  'tableCell',
  'taskDelimiter',
  'blockquote',
  'htmlTag',
  'htmlAttr',
  'htmlAttrValue',
] as const;
