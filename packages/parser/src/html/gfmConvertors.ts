import { HTMLConvertorMap, HTMLToken, OpenTagToken } from '@t/renderer';
import { Node, ListNode, TableNode, TableCellNode, BlockQuoteNode } from '../commonmark/node';
import { escapeXml } from '../commonmark/common';
import {
  getAlertTitle,
  shouldRenderAlertTitle,
} from '../commonmark/gfm/alertBlockQuote';

export const gfmConvertors: HTMLConvertorMap = {
  strike(_, { entering }) {
    return {
      type: entering ? 'openTag' : 'closeTag',
      tagName: 'del',
    };
  },

  blockQuote(node, { entering }) {
    const alertData = (node as BlockQuoteNode).alertData;

    if (!alertData) {
      return {
        type: entering ? 'openTag' : 'closeTag',
        tagName: 'blockquote',
        outerNewLine: true,
        innerNewLine: true,
      };
    }

    if (!entering) {
      return {
        type: 'closeTag',
        tagName: 'div',
        outerNewLine: true,
      };
    }

    const typeClass = alertData.type.toLowerCase();
    const tokens: HTMLToken[] = [
      {
        type: 'openTag',
        tagName: 'div',
        attributes: {
          class: `markdown-alert markdown-alert-${typeClass}`,
        },
        outerNewLine: true,
      },
    ];

    if (shouldRenderAlertTitle(alertData)) {
      tokens.push(
        {
          type: 'openTag',
          tagName: 'p',
          attributes: {
            class: 'markdown-alert-title',
          },
        },
        {
          type: 'text',
          content: escapeXml(getAlertTitle(alertData)),
        },
        {
          type: 'closeTag',
          tagName: 'p',
        }
      );
    }

    return tokens;
  },

  item(node: Node, { entering }) {
    const { checked, task } = (node as ListNode).listData!;

    if (entering) {
      const itemTag: OpenTagToken = {
        type: 'openTag',
        tagName: 'li',
        outerNewLine: true,
      };

      if (task) {
        return [
          itemTag,
          {
            type: 'openTag',
            tagName: 'input',
            selfClose: true,
            attributes: {
              ...(checked && { checked: '' }),
              disabled: '',
              type: 'checkbox',
            },
          },
          {
            type: 'text',
            content: ' ',
          },
        ];
      }
      return itemTag;
    }

    return {
      type: 'closeTag',
      tagName: 'li',
      outerNewLine: true,
    };
  },

  table(_, { entering }) {
    return {
      type: entering ? 'openTag' : 'closeTag',
      tagName: 'table',
      outerNewLine: true,
    };
  },

  tableHead(_, { entering }) {
    return {
      type: entering ? 'openTag' : 'closeTag',
      tagName: 'thead',
      outerNewLine: true,
    };
  },

  tableBody(_, { entering }) {
    return {
      type: entering ? 'openTag' : 'closeTag',
      tagName: 'tbody',
      outerNewLine: true,
    };
  },

  tableRow(node: Node, { entering }) {
    if (entering) {
      return {
        type: 'openTag',
        tagName: 'tr',
        outerNewLine: true,
      };
    }

    const result: HTMLToken[] = [];
    if (node.lastChild) {
      const columnLen = (node.parent!.parent as TableNode).columns.length;
      const lastColIdx = (node.lastChild as TableCellNode).endIdx;
      for (let i = lastColIdx + 1; i < columnLen; i += 1) {
        result.push(
          {
            type: 'openTag',
            tagName: 'td',
            outerNewLine: true,
          },
          {
            type: 'closeTag',
            tagName: 'td',
            outerNewLine: true,
          }
        );
      }
    }

    result.push({
      type: 'closeTag',
      tagName: 'tr',
      outerNewLine: true,
    });

    return result;
  },

  tableCell(node: Node, { entering }) {
    if ((node as TableCellNode).ignored) {
      return {
        type: 'text',
        content: '',
      };
    }

    const tablePart = node.parent!.parent!;
    const tagName = tablePart.type === 'tableHead' ? 'th' : 'td';
    const table = tablePart.parent as TableNode;
    const columnInfo = table.columns[(node as TableCellNode).startIdx];
    const attributes = columnInfo?.align ? { align: columnInfo.align } : null;

    if (entering) {
      return {
        type: 'openTag',
        tagName,
        outerNewLine: true,
        ...(attributes && { attributes }),
      };
    }

    return {
      type: 'closeTag',
      tagName,
      outerNewLine: true,
    };
  },
};
