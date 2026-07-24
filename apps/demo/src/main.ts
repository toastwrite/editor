import { Editor, Viewer } from '@toastwrite/editor';
import '@toastwrite/editor/style.css';
import { DEMO_MARKDOWN } from './demo-markdown.js';

const editorRoot = document.querySelector('#editor-root') as HTMLElement;
const viewerRoot = document.querySelector('#viewer-root') as HTMLElement;

const viewer = new Viewer({
  el: viewerRoot,
  initialValue: DEMO_MARKDOWN,
  height: '100%',
  frontMatter: true,
  referenceDefinition: true,
});

const editor = new Editor({
  el: editorRoot,
  initialValue: DEMO_MARKDOWN,
  height: '100%',
  previewStyle: 'vertical',
  previewSplitter: true,
  frontMatter: true,
  referenceDefinition: true,
  events: {
    change: () => {
      viewer.setMarkdown(editor.getMarkdown());
    },
  },
});

export { editor, viewer };
