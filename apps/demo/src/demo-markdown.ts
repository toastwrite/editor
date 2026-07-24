/**
 * Showcase markdown for the demo app — covers every feature supported by
 * @toastwrite/parser and the editor toolbar.
 */
export const DEMO_MARKDOWN = `![Toastwrite Editor](https://uicdn.toast.com/toastui/img/tui-editor-bi.png)

# Welcome to @toastwrite/editor

This is a **fresh implementation** built for Node 22+, powered by [\`@toastwrite/parser\`](https://github.com/toastwrite/editor).

It has been _released as open source_ and has ~~continually~~ evolved to **receive community support**.

Visit https://github.com/toastwrite/editor or www.github.com for more information.

Contact the team at contact@example.com.

## Headings

### ATX headings

# Heading 1
## Heading 2
### Heading 3
#### Heading 4
##### Heading 5
###### Heading 6

### Setext headings

Setext Heading 1
================

Setext Heading 2
----------------

## Text formatting

**Bold text**, *italic text*, ***bold and italic***, ~~strikethrough text~~, and \`inline code\`.

## Links

- Inline link: [Toastwrite Editor on GitHub](https://github.com/toastwrite/editor)
- Autolink URL: https://github.com/toastwrite/editor
- Autolink www: www.github.com
- Reference link: [Reference link][toastwrite]

## Lists

### Bullet list

- First item
- Second item
    - Nested item
    - Another nested item
- Third item

### Ordered list

1. First step
2. Second step
    1. Sub step
    2. Another sub step
3. Third step

### Task list

- [x] Markdown mode with live preview
- [x] Syntax highlighting in the editor
- [ ] Plugin ecosystem (coming soon)
- [ ] Custom themes
    - [x] Nested completed task
    - [ ] Nested open task

## Blockquote

> This is a blockquote.
>
> It can span multiple lines and include **formatted** text.
>
> > Nested blockquotes are supported too.

## GFM alerts

> [!NOTE]
> Useful information that users should know, even when skimming content.

> [!TIP]
> Helpful advice for doing things better or more easily.

> [!IMPORTANT]
> Key information users need to know to achieve their goal.

> [!WARNING]
> Urgent info that needs immediate attention to avoid problems.

> [!CAUTION]
> Advises about risks or negative outcomes of certain actions.

> [!NOTE](Custom title)
> Alerts can use a custom title in parentheses.

> [!TIP] Custom title after marker
> Alerts can also use a custom title after the marker.

## Table

| Feature | Markdown | Notes |
| --- | --- | --- |
| Live preview | Yes | Vertical and tab layouts |
| Line numbers | Yes | Optional gutter in markdown mode |
| Toolbar commands | Yes | Bold, lists, links, and more |
| Task lists | Yes | GFM task list syntax |
| Tables | Yes | GFM table syntax |

### Table with column alignment

| Left | Center | Right |
| :--- | :---: | ---: |
| a | b | c |
| longer text | centered | right |

## Code block

\`\`\`ts
import { Editor, Viewer } from '@toastwrite/editor';
import '@toastwrite/editor/style.css';

const editor = new Editor({
  el: document.querySelector('#editor-root')!,
  previewStyle: 'vertical',
  previewSplitter: true,
});

const viewer = new Viewer({
  el: document.querySelector('#viewer-root')!,
  initialValue: editor.getMarkdown(),
});
\`\`\`

## Horizontal rule

---

[toastwrite]: https://github.com/toastwrite/editor "Toastwrite Editor"
`;
