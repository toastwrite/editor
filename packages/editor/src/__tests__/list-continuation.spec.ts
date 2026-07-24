import { afterEach, describe, expect, it } from 'vitest';
import { Editor } from '../editor.js';

const LIST_WITH_CONTINUATION = `- First item
- Second item
    - Nested item
    - Another nested item
    - jnjn
    - kdmkcd
ksmkmkmdksmdksmkd
dskmd
sdskmds
dksmd
- Third item`;

describe('list continuation', () => {
  let container: HTMLDivElement;

  afterEach(() => {
    container?.remove();
  });

  it('renders lazy list continuations with line breaks in preview', () => {
    container = document.createElement('div');
    document.body.appendChild(container);

    const editor = new Editor({
      el: container,
      initialValue: LIST_WITH_CONTINUATION,
      previewStyle: 'vertical',
    });

    const previewHtml = container.querySelector('.toastwrite-editor-md-preview')?.innerHTML ?? '';

    expect(previewHtml).toContain('kdmkcd<br');
    expect(previewHtml).toContain('ksmkmkmdksmdksmkd<br');
    expect(previewHtml).toContain('dskmd<br');
    expect(previewHtml).not.toContain(
      'kdmkcd ksmkmkmdksmdksmkd dskmd sdskmds dksmd'
    );

    editor.destroy();
  });
});
